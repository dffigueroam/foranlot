# 🧪 Testing Manual - Sistema de Notificaciones

## Preparación Previa

```bash
# 1. Asegurar que la base de datos está lista
npm run dev

# 2. Crear usuarios de prueba si no existen
# Usuario 1: Predictor
# Usuario 2: Suscriptor

# 3. Limpiar notificaciones anteriores (opcional)
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '1 day';
```

---

## 📋 Test Cases

### Test 1: Notificar Resultados Oficiales (Global)

**Objetivo:** Verificar que TODOS los usuarios reciben notificación de resultados  
**Duración:** 2 minutos

```bash
# 1. Insertar resultado oficial
INSERT INTO lottery_results (
  lottery_name, 
  draw_date, 
  winning_number, 
  digits_3, 
  digits_4
) VALUES (
  'Powerball',
  CURRENT_DATE,
  '1234',
  '234',
  '1234'
);

# 2. Ejecutar el cron manualmente
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/cron/verify

# 3. Verificar notificaciones creadas
SELECT COUNT(*) FROM notifications 
WHERE type = 'official_results' 
AND created_at > NOW() - INTERVAL '5 minutes';

# Esperado: Contar = número de usuarios activos
```

**Verificación en UI:**
- [ ] Centro de notificaciones muestra el resultado
- [ ] Título: "Resultados de Powerball"
- [ ] Mensaje contiene fecha y número ganador

---

### Test 2: Notificar Acierto Exacto

**Objetivo:** Verificar notificación cuando predicción es exacta  
**Duración:** 5 minutos  
**Prerrequisitos:** Test 1 completado

```bash
# 1. Crear predicción pendiente
INSERT INTO predictions (
  user_id, 
  lottery_name, 
  lottery_type, 
  predicted_number, 
  draw_date, 
  draw_time
) VALUES (
  1,  -- Predictor ID
  'Powerball',
  '4_digits',
  '1234',
  CURRENT_DATE,
  '21:00'
);

# 2. Ejecutar cron de verificación
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/cron/verify

# 3. Verificar notificación de acierto
SELECT * FROM notifications 
WHERE user_id = 1 
AND type = 'prediction_hit' 
AND created_at > NOW() - INTERVAL '5 minutes';

# 4. Verificar notificación de pago
SELECT * FROM notifications 
WHERE user_id = 1 
AND type = 'payment_received' 
AND created_at > NOW() - INTERVAL '5 minutes';

# Esperado: 2 notificaciones (acierto + pago)
```

**Verificación en UI:**
- [ ] Notificación de acierto exacto ("¡ACIERTO EXACTO!")
- [ ] Muestra cantidad ganada
- [ ] Notificación de pago recibido

---

### Test 3: Notificar Combinación

**Objetivo:** Verificar notificación cuando hay combinación válida  
**Duración:** 5 minutos

```bash
# 1. Cambiar resultado a una permutación
UPDATE lottery_results 
SET winning_number = '4321' 
WHERE lottery_name = 'Powerball';

# 2. Ejecutar cron nuevamente
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3000/api/cron/verify

# 3. Verificar notificación
SELECT * FROM notifications 
WHERE type = 'prediction_hit' 
AND related_data->>'matchType' = 'combination';

# Esperado: Notificación con "¡COMBINACIÓN!"
```

**Verificación en UI:**
- [ ] Muestra "¡COMBINACIÓN!" en lugar de exacto
- [ ] Ganancias menores que acierto exacto
- [ ] Mensaje diferente

---

### Test 4: Notificar Cambio de Ranking

**Objetivo:** Verificar que cambios de posición se notifican  
**Duración:** 5 minutos

```bash
# 1. Crear varias predicciones correctas para usuario
INSERT INTO predictions VALUES 
(1, DEFAULT, DEFAULT, 1, 'Powerball', '3_digits', '123', CURRENT_DATE, '21:00', true, true, 'exact', 0, '123', 100, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, DEFAULT, DEFAULT, 1, 'Powerball', '3_digits', '456', CURRENT_DATE - INTERVAL '1 day', '21:00', true, true, 'exact', 0, '456', 100, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

# 2. Ejecutar ranking update
-- La función updateRankings() se ejecuta en el cron

# 3. Verificar notificación de ranking
SELECT * FROM notifications 
WHERE type = 'ranking_change' 
AND user_id = 1 
AND created_at > NOW() - INTERVAL '5 minutes';

# Esperado: Notificación de cambio de posición
```

**Verificación en UI:**
- [ ] Notificación de ingreso a ranking O subida de posición
- [ ] Muestra nueva posición (#1, #2, etc.)
- [ ] Muestra % de aciertos

---

### Test 5: Notificar Servicio Usado (Contrato)

**Objetivo:** Verificar que predictor recibe notificación de nueva suscripción  
**Duración:** 5 minutos

```bash
# 1. Obtener IDs de usuarios
SELECT id, username FROM users LIMIT 2;
-- Usuario A (ID 1): Predictor
-- Usuario B (ID 2): Suscriptor

# 2. Crear contrato
curl -X POST http://localhost:3000/api/contracts \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=TOKEN_AQUI" \
  -d '{
    "predictorId": 1,
    "lotteryType": "3_digits",
    "duration": "monthly"
  }'

# 3. Verificar notificaciones al predictor
SELECT * FROM notifications 
WHERE user_id = 1 
AND type IN ('service_used', 'new_follower') 
AND created_at > NOW() - INTERVAL '5 minutes';

# Esperado: 2 notificaciones (servicio en uso + nuevo seguidor)
```

**Verificación en UI (Predictor):**
- [ ] Notificación "X inició un contrato mensual"
- [ ] Notificación "X comenzó a seguir tus pronósticos"

---

### Test 6: Notificar Cambio de Ranking (Bajada)

**Objetivo:** Verificar notificación cuando usuario baja en ranking  
**Duración:** 5 minutos

```bash
# 1. Hacer que otro usuario tenga mejor accuracy
-- Crear múltiples aciertos para usuario 2
INSERT INTO predictions (user_id, lottery_name, lottery_type, predicted_number, draw_date, is_verified, is_correct)
VALUES (2, 'Powerball', '3_digits', '100', CURRENT_DATE, true, true),
       (2, 'Powerball', '3_digits', '200', CURRENT_DATE, true, true),
       (2, 'Powerball', '3_digits', '300', CURRENT_DATE, true, true);

# 2. Ejecutar actualización de ranking
-- Se ejecuta automáticamente en cron

# 3. Verificar que usuario 1 bajó
SELECT * FROM user_stats WHERE user_id = 1;

# Esperado: rank_position cambió (subió número = bajó posición)
```

**Verificación en UI (Usuario 1):**
- [ ] Notificación de BAJADA en ranking
- [ ] Muestra nueva posición (más baja)

---

### Test 7: Limpiar Notificaciones

**Objetivo:** Verificar gestión de notificaciones  
**Duración:** 3 minutos

```bash
# 1. Marcar como leídas
curl -X POST http://localhost:3000/api/notifications/mark-read \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=TOKEN" \
  -d '{ "notificationId": 1 }'

# 2. Verificar cambio
SELECT is_read FROM notifications WHERE id = 1;
# Esperado: true

# 3. Marcar todas como leídas
curl -X POST http://localhost:3000/api/notifications/mark-all-read \
  -H "Cookie: auth-token=TOKEN"

# 4. Verificar
SELECT COUNT(*) FROM notifications 
WHERE user_id = 1 AND is_read = false;
# Esperado: 0
```

---

### Test 8: Suscripción Próxima a Vencer

**Objetivo:** Verificar notificación 3 días antes del vencimiento  
**Duración:** 5 minutos

```bash
# 1. Crear selección con expiry en 2 días
INSERT INTO user_selections (
  subscriber_id,
  selection_type,
  selected_user_id,
  lottery_type,
  credits_per_day,
  start_date,
  expiry_date,
  is_active
) VALUES (
  2,  -- Usuario suscriptor
  'user',
  1,  -- Usuario predictor
  '3_digits',
  1,
  CURRENT_DATE - 4,
  CURRENT_DATE + 2,  -- Vence en 2 días
  true
);

# 2. Ejecutar cron de renovación (si existe)
curl http://localhost:3000/api/cron/renew-contracts

# 3. Verificar notificación
SELECT * FROM notifications 
WHERE type = 'subscription_expiring' 
AND user_id = 2 
AND created_at > NOW() - INTERVAL '5 minutes';

# Esperado: Notificación avisando vencimiento en 2 días
```

**Verificación en UI:**
- [ ] Título menciona "próxima a vencer"
- [ ] Cuenta atrás: "2 día(s)"
- [ ] Invita a renovar

---

## 📊 Checklist de Verificación General

### Base de Datos
- [ ] Tabla `notifications` contiene registros
- [ ] Columna `type` tiene valores válidos
- [ ] `related_data` contiene JSON válido
- [ ] `created_at` y `updated_at` se actualizan

### Función de Notificación
- [ ] `createNotification()` inserta registros
- [ ] `getUserNotifications()` filtra correctamente
- [ ] `getUnreadNotificationCount()` cuenta bien
- [ ] `markNotificationAsRead()` actualiza flag

### Integración
- [ ] Cron executa sin errores
- [ ] Logs muestran "[v0]" prefix
- [ ] No hay excepciones en consola
- [ ] `related_data` se llena correctamente

### UI
- [ ] Notificaciones aparecen en centro
- [ ] Campana muestra contador
- [ ] Marcar como leído funciona
- [ ] Mensajes en español todo

---

## 🔍 Debugging Tips

### Ver todos los errores de notificaciones
```sql
SELECT * FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

### Ver notificaciones de un usuario específico
```sql
SELECT id, type, title, is_read, created_at 
FROM notifications 
WHERE user_id = 1 
ORDER BY created_at DESC 
LIMIT 20;
```

### Ver JSON de una notificación
```sql
SELECT type, related_data, message 
FROM notifications 
WHERE type = 'prediction_hit' 
LIMIT 1;
```

### Buscar notificaciones por tipo
```sql
SELECT COUNT(*), type FROM notifications 
GROUP BY type 
ORDER BY COUNT(*) DESC;
```

---

## 🐛 Problemas Comunes

### Problema: No aparecen notificaciones
**Soluciones:**
1. Verificar que usuario está autenticado
2. Revisar logs con "Error creating notification"
3. Verificar conexión a base de datos
4. Confirmar que `DATABASE_URL` es válida

### Problema: Notificaciones duplicadas
**Soluciones:**
1. Revisar que cron no se ejecuta múltiples veces
2. Confirmar `CRON_SECRET` es válida
3. Verificar que funciones se llaman una sola vez

### Problema: Texto en inglés en lugar de español
**Soluciones:**
1. Revisar archivos modified tienen caracteres español
2. Confirmar encoding es UTF-8
3. Revisar que mensaje está en español en la función

---

## ✅ Tests Exitosos = ✓

Una vez completes todos los tests:

```typescript
// Puedes confiar que:
✓ Notificaciones se crean correctamente
✓ Se guardan en base de datos
✓ Usuarios las ven en the app
✓ Textos están en español
✓ Cálculos de ganancias son correctos
✓ Rankings se actualizan bien
✓ Contratos se notifican
✓ Gesión de lectura funciona
```

---

**Última actualización:** Febrero 15, 2026  
**Para:** QA y Testing  
**Estimado:** 30-45 minutos todos los tests

