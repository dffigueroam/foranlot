# 🔔 Sistema Integral de Notificaciones - ForanLot

## Descripción General

El sistema de notificaciones de ForanLot mantiene a los usuarios informados sobre eventos importantes en tiempo real. Hay **9 tipos de notificaciones** automatizadas que se disparan en diferentes eventos del sistema.

---

## 📋 Tipos de Notificaciones

### 1. **Resultados Oficiales** (`official_results`)
**Cuándo se dispara:** Cuando nuevos resultados de loterias se publican en el sistema  
**Quién recibe:** TODOS los usuarios activos  
**Función:** `notifyOfficialResults()`  
**Contenido:**
- Nombre de la lotería
- Fecha del sorteo
- Número ganador
- Invitación a revisar sus predicciones

**Ejemplo de mensaje:**
```
"Se han publicado los resultados del 2025-02-15. 
Número ganador: 1234. Revisa si acertaste."
```

---

### 2. **Recomendaciones para Contratos Premium** (`contract_recommendations`)
**Cuándo se dispara:** Cuando hay nuevas recomendaciones de números para apostar  
**Quién recibe:** Usuarios con contratos premium activos  
**Función:** `notifyContractRecommendations()`  
**Contenido:**
- Nombre del predictor recomendado
- Tipo de lotería (3_digits, 4_digits, etc.)
- Números recomendados
- Invitación a apostar

**Ejemplo de mensaje:**
```
"PronosticadorPro tiene nuevas recomendaciones para 4_digits. 
Números sugeridos: 1234, 5678"
```

---

### 3. **Servicio en Uso** (`service_used`)
**Cuándo se dispara:** Cuando alguien contrata los servicios de predicción de un usuario  
**Quién recibe:** El predictor/usuario con servicios activos  
**Función:** `notifyServiceUsed()`  
**Contenido:**
- Nombre del suscriptor
- Tipo de contrato (semanal/mensual)
- Tipo de lotería
- Duración del contrato

**Ejemplo de mensaje:**
```
"NumerosMagicos inició un contrato para recibir tus pronósticos 
de 3_digits por contrato mensual."
```

---

### 4. **Cambio de Ranking** (`ranking_change`)
**Cuándo se dispara:** Cuando la posición del usuario en el ranking cambia  
**Quién recibe:** El usuario afectado  
**Función:** `notifyRankingChange()`  
**Contenido:**
- Nueva posición
- Posición anterior (si existe)
- Porcentaje de aciertos
- Si subió o bajó

**Ejemplos de mensajes:**
```
Primera vez en ranking:
"¡Felicitaciones! Ingresaste al ranking en posición #5 con 85.50% de aciertos."

Subió de posición:
"¡Excelente! Subiste en el ranking. Ahora estás en posición #3."

Bajó de posición:
"Nota que bajaste en el ranking. Ahora estás en posición #8."
```

---

### 5. **Acierto en Predicción** (`prediction_hit`)
**Cuándo se dispara:** Cuando una predicción del usuario coincide con el resultado oficial  
**Quién recibe:** El usuario predictor  
**Función:** `notifyPredictionHit()`  
**Contenido:**
- Tipo de acierto (EXACTO o COMBINACIÓN)
- Lotería
- Número predicho
- Número ganador
- Ganancias obtenidas

**Ejemplos de mensajes:**
```
Acierto exacto:
"¡ACIERTO EXACTO! Predijiste 1234 y salió 1234 en Powerball. 
Ganaste $2,000.00 en ganancias."

Acierto por combinación:
"¡COMBINACIÓN! Tu predicción 1234 combinó con 4321 en FreGordo. 
Ganaste $400.00 en ganancias."
```

---

### 6. **Suscripción Próxima a Vencer** (`subscription_expiring`)
**Cuándo se dispara:** 3 días antes de que expire la suscripción premium  
**Quién recibe:** Usuarios con suscripciones activas  
**Función:** `notifySubscriptionExpiring()`  
**Contenido:**
- Días restantes
- Fecha de vencimiento
- Invitación a renovar

**Ejemplo de mensaje:**
```
"Tu caducidad de créditos premium está programada para 2025-02-18. 
Renuévala para no perder acceso."
```

---

### 7. **Suscripción Expirada** (`subscription_expired`)
**Cuándo se dispara:** Cuando la suscripción premium vence  
**Quién recibe:** El usuario con suscripción expirada  
**Función:** `notifySubscriptionExpired()`  
**Contenido:**
- Notificación de expiración
- Invitación a suscribirse nuevamente

**Ejemplo de mensaje:**
```
"Tu plan premium ha terminado. Suscríbete nuevamente para 
continuar usando funciones premium."
```

---

### 8. **Pago Recibido** (`payment_received`)
**Cuándo se dispara:** Cuando el usuario recibe ganancias por sus predicciones  
**Quién recibe:** El usuario que recibe el pago  
**Función:** `notifyPaymentReceived()`  
**Contenido:**
- Monto recibido
- Fuente del pago
- Invitación a revisar cuenta de pagos

**Ejemplo de mensaje:**
```
"Recibiste $2,000.00 por acierto en Powerball. 
Revisa tu cuenta de pagos."
```

---

### 9. **Nuevo Seguidor** (`new_follower`)
**Cuándo se dispara:** Cuando alguien comienza a seguir los pronósticos de un usuario  
**Quién recibe:** El predictor seguido  
**Función:** `notifyNewFollower()`  
**Contenido:**
- Nombre del nuevo seguidor
- Avatar del seguidor (opcional)
- Bienvenida

**Ejemplo de mensaje:**
```
"ChanceGuru comenzó a seguir tus pronósticos. 
¡Bienvenido a tu audiencia!"
```

---

## 🔄 Flujo de Notificaciones por Evento

### Cuando se publican resultados oficiales (Cron a las 9 PM):

```
1. API: GET /api/cron/verify
   ↓
2. verification.ts: verifyPendingPredictions()
   ↓
3. notifyOfficialResults() 
   → Notifica a TODOS los usuarios
   ↓
4. Procesa cada predicción:
   - Compara con números ganadores
   - Si hay acierto → notifyPredictionHit()
   - Si es pago → notifyPaymentReceived()
   ↓
5. ranking.ts: updateRankings()
   - Actualiza posiciones
   - notifyRankingChange() si hay movimiento
```

---

### Cuando se contrata un servicio:

```
1. Usuario suscriptor contrata servicio
   ↓
2. contracts.ts: createContract()
   ↓
3. notifyServiceUsed()
   → Notifica al predictor
   ↓
4. notifyNewFollower()
   → Notifica al predictor (nuevo seguidor)
```

---

## 📊 Estructura de Datos

### Interface `Notification`:
```typescript
interface Notification {
  id: number
  user_id: number
  type: NotificationType  // Uno de los 9 tipos
  title: string           // Titular corto
  message: string         // Mensaje completo en español
  related_data?: Record<string, any>
  is_read: boolean
  created_at: string
  updated_at: string
}
```

### Tipos disponibles:
```typescript
type NotificationType = 
  | "official_results"
  | "contract_recommendations"
  | "service_used"
  | "ranking_change"
  | "prediction_hit"
  | "subscription_expiring"
  | "subscription_expired"
  | "payment_received"
  | "new_follower"
```

---

## 🛠️ Funciones Disponibles

### En `lib/notifications.ts`:

#### Crear notificaciones (uso interno):
- `createNotification(userId, type, title, message, relatedData?)`
- `notifyOfficialResults(lotteryName, drawDate, winningNumber)`
- `notifyContractRecommendations(subscriberId, targetUsername, predictorId, lotteryType, recommendedNumbers)`
- `notifyServiceUsed(predictorId, subscriberUsername, contractDuration, lotteryType)`
- `notifyRankingChange(userId, newRank, previousRank, accuracyPercentage)`
- `notifyPredictionHit(userId, lotteryName, predictedNumber, winningNumber, matchType, earnings)`
- `notifySubscriptionExpiring(userId, expiryDate, daysLeft)`
- `notifySubscriptionExpired(userId)`
- `notifyPaymentReceived(userId, amount, source)`
- `notifyNewFollower(predictorId, followerUsername, followerAvatar?)`

#### Consultar notificaciones:
- `getUserNotifications(userId, unreadOnly = false)` - Obtener notificaciones del usuario
- `getUnreadNotificationCount(userId)` - Contar no leídas

#### Gestionar notificaciones:
- `markNotificationAsRead(notificationId)`
- `markAllNotificationsAsRead(userId)`
- `deleteNotification(notificationId)`
- `deleteReadNotifications(userId)`

---

## ⚙️ Integración con Crons

### Cron 1: Verificación (9 PM diarios)
**Ruta:** `GET /api/cron/verify`  
**Frecuencia:** `0 21 * * *` (9 PM UTC-5)  
**Notificaciones disparadas:**
- ✅ Resultados oficiales (a TODOS)
- ✅ Aciertos en predicciones
- ✅ Pagos recibidos
- ✅ Cambios de ranking

### Cron 2: Renovación de suscripciones
**Ruta:** `GET /api/cron/renew-contracts`  
**Frecuencia:** `0 0 * * *` (12 AM UTC-5)  
**Notificaciones disparadas:**
- ℹ️ Suscripción próxima a vencer (3 días antes)
- ❌ Suscripción expirada

---

## 📱 Integración en UI

### Componentes relacionados:
- `components/notifications/` - Componentes para mostrar notificaciones
- `app/notifications/page.tsx` - Página del centro de notificaciones
- `components/layout/notification-bell.tsx` - Campana en el header

### Acciones del servidor:
- `app/actions/notifications.ts` - Server actions para marcar como leído, etc.

---

## 🔐 Seguridad y Privacidad

- ✅ Solo usuarios autenticados reciben notificaciones
- ✅ Cada usuario ve solo sus propias notificaciones
- ✅ Token JWT válido requerido
- ✅ Los datos sensibles (montos, predicciones) no se incluyen en el `related_data` público

---

## 📈 Monitoreo y Debugging

### Logs disponibles:
```typescript
console.log("[v0] Notified all users about results for ${lotteryName}")
console.log("[v0] Error notifying official results:", error)
```

### Para debugging:
- Revisar tabla `notifications`
- Filtrar por `user_id` específico
- Buscar por `type` para ver cada categoría
- Revisar `related_data` para información completa

---

## 📝 Checklist de Implementación

- [x] Interface `NotificationType` con 9 tipos
- [x] Función `createNotification()` mejorada
- [x] Función `notifyOfficialResults()` para resultados globales
- [x] Función `notifyPredictionHit()` con cálculo de ganancias
- [x] Función `notifyPaymentReceived()` integrada
- [x] Función `notifyServiceUsed()` cuando se contrata
- [x] Función `notifyNewFollower()` nuevo seguidor
- [x] Función `notifyRankingChange()` con cambios de posición
- [x] Integración en `verification.ts` (cron)
- [x] Integración en `ranking.ts` (cambios)
- [x] Integración en `contracts.ts` (nuevos contratos)
- [x] Documentación completa

---

## 🚀 Próximos Pasos Sugeridos

1. **Email notifications:** Enviar emails cuando hay aciertos (especialmente important)
2. **Push notifications:** Integrar servicio de push (OneSignal, Firebase)
3. **In-app toast:** Mostrar toast/snackbar cuando se crea notificación
4. **Notificación inline:** Banners emergentes para resultados y aciertos
5. **Preferencias:** Permitir usuarios desactivar ciertos tipos de notificaciones
6. **Historial:** Guardar notificaciones por 30 días (actualmente infinito)

---

**Última actualización:** Febrero 15, 2026  
**Versión:** 1.0 - Sistema completo

