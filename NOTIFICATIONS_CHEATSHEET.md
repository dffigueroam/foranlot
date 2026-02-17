# 📋 Cheatsheet - Notificaciones ForanLot

## 🎯 Las 9 Notificaciones (Resumen Ultra-Rápido)

```
1️⃣ official_results      → Resultados publicados          → notifyOfficialResults()
2️⃣ prediction_hit        → Predicción correcta            → notifyPredictionHit()
3️⃣ payment_received      → Ganancias disponibles          → notifyPaymentReceived()
4️⃣ ranking_change        → Posición sube/baja            → notifyRankingChange()
5️⃣ service_used          → Alguien te contrata           → notifyServiceUsed()
6️⃣ new_follower          → Nuevo seguidor                → notifyNewFollower()
7️⃣ contract_recommendations → Nuevas recomendaciones     → notifyContractRecommendations()
8️⃣ subscription_expiring → Va a vencer en 3 días         → notifySubscriptionExpiring()
9️⃣ subscription_expired  → Suscripción expiró            → notifySubscriptionExpired()
```

---

## 🔌 Cómo Usar (Código)

### Importar
```typescript
import { 
  notifyPredictionHit,
  notifyRankingChange,
  notifyServiceUsed 
  // ... etc
} from "@/lib/notifications"
```

### Notificar acierto
```typescript
await notifyPredictionHit(
  userId,        // Int
  "Powerball",   // String
  "1234",        // Número predicho
  "1234",        // Número ganador
  "exact",       // "exact" | "combination"
  200000         // Ganancias en centavos
)
```

### Notificar ranking
```typescript
await notifyRankingChange(
  userId,        // Int
  3,             // Nueva posición
  5,             // Posición anterior (null si primera vez)
  87.5           // % aciertos
)
```

### Notificar contrato
```typescript
await notifyServiceUsed(
  predictorId,   // Int
  "ChanceGuru",  // Username
  "monthly",     // "weekly" | "monthly"
  "3_digits"     // Tipo lotería
)
```

---

## 📊 Flujo por Evento

### Resultados Publicados (9 PM Cron)
```
API: GET /api/cron/verify
  ↓
notifyOfficialResults()     ← Todos reciben
  ↓
Analiza predicciones
  ↓
notifyPredictionHit()       ← Si hay acierto
  ↓
notifyPaymentReceived()     ← Pago registrado
  ↓
updateRankings()
  ↓
notifyRankingChange()       ← Si cambió posición
```

### Nuevo Contrato
```
User A contrata a User B
  ↓
createContract()
  ↓
notifyServiceUsed()         ← User B recibe
  ↓
notifyNewFollower()         ← User B recibe
```

---

## 🎯 Casos de Uso Rápidos

### Usuario A predice exacto
```typescript
// Automático en cron verificación
await notifyPredictionHit(
  userIdA,
  "Powerball",
  "1234",      // Predijo
  "1234",      // Salió
  "exact",
  1000000      // $10,000 COP
)
// Usuario A ve en notificaciones:
// "¡ACIERTO EXACTO! Predijiste 1234 y salió 1234. Ganaste $10,000.00"
```

### Usuario A sube en ranking
```typescript
// Automático en updateRankings()
await notifyRankingChange(
  userIdA,
  3,           // Subió a posición 3
  5,           // Estaba en 5
  87.5         // % aciertos
)
// Usuario A ve:
// "¡Excelente! Subiste en el ranking. Ahora estás en posición #3."
```

### Usuario B contrata a Usuario A
```typescript
// En createContract()
await notifyServiceUsed(
  userIdA,
  "ChanceGuru", // Username de B
  "monthly",
  "3_digits"
)
// Usuario A ve:
// "ChanceGuru inició un contrato para recibir tus pronósticos de 3_digits por contrato mensual."

await notifyNewFollower(
  userIdA,
  "ChanceGuru"
)
// Usuario A también ve:
// "ChanceGuru comenzó a seguir tus pronósticos. ¡Bienvenido a tu audiencia!"
```

---

## 💾 Estructura JSON `related_data`

```typescript
// official_results
{
  lotteryName: "Powerball",
  drawDate: "2025-02-15",
  winningNumber: "1234"
}

// prediction_hit
{
  lotteryName: "Powerball",
  predictedNumber: "1234",
  winningNumber: "1234",
  matchType: "exact",
  earnings: 200000
}

// ranking_change
{
  newRank: 3,
  previousRank: 5,
  accuracyPercentage: 87.5,
  isImprovement: true
}

// service_used
{
  subscriberUsername: "ChanceGuru",
  contractDuration: "monthly",
  lotteryType: "3_digits"
}
```

---

## 📱 API de Consulta

```typescript
// Obtener notificaciones del usuario
await getUserNotifications(userId)
await getUserNotifications(userId, true)  // Solo no leídas

// Contar no leídas
await getUnreadNotificationCount(userId)  // → Int

// Marcar como leída
await markNotificationAsRead(notificationId)
await markAllNotificationsAsRead(userId)

// Eliminar
await deleteNotification(notificationId)
await deleteReadNotifications(userId)
```

---

## 🔍 Debugging SQL

```sql
-- Ver todas las notificaciones
SELECT * FROM notifications ORDER BY created_at DESC;

-- De un usuario específico
SELECT * FROM notifications WHERE user_id = 1 ORDER BY created_at DESC;

-- Solo no leídas
SELECT * FROM notifications WHERE is_read = false;

-- Por tipo
SELECT COUNT(*), type FROM notifications GROUP BY type;

-- Ver JSON completo
SELECT type, related_data FROM notifications WHERE id = 123;
```

---

## ⚠️ Errores Comunes

| Error | Solución |
|-------|----------|
| `Cannot find module` | Falta `import` al inicio |
| `userId is not a number` | Haré `Number(userId)` antes |
| `undefined related_data` | El JSON se guarda automático |
| Notificación no aparece | Revisar user_id, usuario existe? |
| Mensaje en inglés | Verificar que está en spanish |

---

## 🎯 Dónde se Disparan Automáticamente

| Lugar | Qué | Cuándo |
|-------|-----|--------|
| `verification.ts` | Resultados + aciertos + pagos | Cron 9 PM |
| `ranking.ts` | Cambios de ranking | Después de cron |
| `contracts.ts` | Servicio usado + seguidor | Al crear contrato |

**No necesitas hacer nada**, ocurre automático.

---

## 📈 Tipos y Interfaces

```typescript
type NotificationType = 
  | "official_results"
  | "prediction_hit"
  | "payment_received"
  | "ranking_change"
  | "service_used"
  | "new_follower"
  | "contract_recommendations"
  | "subscription_expiring"
  | "subscription_expired"

interface Notification {
  id: number
  user_id: number
  type: NotificationType
  title: string
  message: string
  related_data?: Record<string, any>
  is_read: boolean
  created_at: string
  updated_at: string
}
```

---

## ✅ Checklist Rápido

- [ ] ¿Importé la función?
- [ ] ¿Paso los parámetros correctos?
- [ ] ¿El userId es un número?
- [ ] ¿Si hay related_data, es JSON válido?
- [ ] ¿Revisar logs [v0] en consola?
- [ ] ¿Si no aparece, revisar cantidad de usuarios activos?

---

## 🚀 Comandos Útiles

```bash
# Ver logs
npm run dev | grep "[v0]"

# Ver notificaciones en BD
psql -c "SELECT * FROM notifications ORDER BY created_at DESC;"

# Contar por tipo
psql -c "SELECT COUNT(*), type FROM notifications GROUP BY type;"

# Limpiar antiguas
psql -c "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days';"
```

---

## 🎓 Conceptos Clave

| Concepto | Explicación |
|----------|------------|
| **type** | Uno de 9 tipos predefinidos |
| **title** | Corto titular (max 255 chars) |
| **message** | Mensaje completo en español |
| **related_data** | JSON con detalles del evento |
| **is_read** | Boolean para marcar como leído |
| **created_at** | Timestamp automático |

---

## 📚 Documentos Completos

- `NOTIFICATION_SYSTEM.md` - Documentación técnica (40 pag)
- `NOTIFICATIONS_QUICK_START.md` - Guía rápida (7 pag)
- `NOTIFICATIONS_TESTING.md` - Testing manual (12 pag)
- `NOTIFICATIONS_SUMMARY.md` - Resumen ejecutivo (4 pag)

---

## 🎯 TL;DR (Too Long; Didn't Read)

**9 notificaciones**, **automáticas**, **en español**, **todo implementado**.

Funciones principales:
```typescript
notifyOfficialResults(lottery, date, number)
notifyPredictionHit(userId, lottery, pred, actual, type, earnings)
notifyRankingChange(userId, newRank, oldRank, accuracy)
notifyServiceUsed(predictorId, username, duration, type)
```

**¡Listo para usar!** 🚀

---

**Última actualización:** Febrero 15, 2026  
**Estado:** ✅ COMPLETADO

