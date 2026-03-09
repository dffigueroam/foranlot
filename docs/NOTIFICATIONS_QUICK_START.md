# ⚡ Guía Rápida - Sistema de Notificaciones ForanLot

## 🎯 Inicio Rápido

### ¿Cuáles son las 5 notificaciones PRINCIPALES?

1. **Resultados Oficiales** - Se notifica a TODOS cuando salen resultados
2. **Acierto en Predicción** - El predictor gana dinero y se notifica
3. **Cambio de Ranking** - Usuario sube o baja en el ranking
4. **Servicio Contratado** - Un predictor es contratado por otro usuario
5. **Nuevo Seguidor** - Un usuario nuevo sigue los pronósticos

---

## 🔌 Cómo Integrar Notificaciones en Nuevo Código

### Paso 1: Importar
```typescript
import { 
  notifyPredictionHit,
  notifyServiceUsed,
  notifyOfficialResults,
  // ... etc
} from "@/lib/notifications"
```

### Paso 2: Usar en tu función
```typescript
// Cuando hay un acierto
await notifyPredictionHit(
  userId,
  "Powerball",      // Nombre lotería
  "1234",           // Lo que predijo
  "1234",           // Lo que salió
  "exact",          // Tipo de match
  200000            // Ganancias en centavos
)

// Cuando alguien se suscribe
await notifyServiceUsed(
  predictorId,
  "ChanceGuru",     // Username del suscriptor
  "monthly",        // Duración contrato
  "3_digits"        // Tipo lotería
)
```

### Paso 3: ¡Listo! ✓
No necesitas hacer más nada. La notificación se crea automáticamente.

---

## 📋 Referencia Rápida de Funciones

```typescript
// CREAR NOTIFICACIONES
notifyOfficialResults(lotteryName, drawDate, winningNumber)
notifyPredictionHit(userId, lotteryName, predicted, actual, matchType, earnings)
notifyServiceUsed(predictorId, subscriberUsername, duration, lotteryType)
notifyRankingChange(userId, newRank, previousRank, accuracy)
notifyPaymentReceived(userId, amount, source)
notifyNewFollower(predictorId, followerUsername, avatar)
notifySubscriptionExpiring(userId, expiryDate, daysLeft)
notifySubscriptionExpired(userId)
notifyContractRecommendations(subId, targetUsername, predictorId, lotteryType, numbers)

// CONSULTAR NOTIFICACIONES
getUserNotifications(userId, unreadOnly = false)
getUnreadNotificationCount(userId)

// GESTIONAR NOTIFICACIONES
markNotificationAsRead(notificationId)
markAllNotificationsAsRead(userId)
deleteNotification(notificationId)
deleteReadNotifications(userId)
```

---

## 🔄 Dónde se Disparan Automáticamente

| Lugar | Qué notifica | Cuándo |
|-------|--------------|--------|
| `lib/verification.ts` | Resultados, aciertos, pagos | Cron 9 PM |
| `lib/ranking.ts` | Cambios de ranking | Después de verificar |
| `lib/contracts.ts` | Contrato usado, nuevo seguidor | Al crear contrato |

**No necesitas hacer nada extra**, ocurre automáticamente.

---

## 💡 Ejemplos Comunes

### Ejemplo 1: Notificar acierto exacto
```typescript
await notifyPredictionHit(
  123,                              // User ID del predictor
  "Chance Colombiano",              // Nombre lotería
  "5678",                           // Predijo esto
  "5678",                           // Salió esto
  "exact",                          // Fue exacto
  1000000                           // $10,000 COP en centavos
)
```

### Ejemplo 2: Notificar cambio de ranking
```typescript
await notifyRankingChange(
  456,                              // User ID
  3,                                // Nueva posición
  5,                                // Posición anterior
  87.5                              // % aciertos
)
```

### Ejemplo 3: Notificar pago
```typescript
await notifyPaymentReceived(
  789,                              // User ID
  500000,                           // $5,000 COP en centavos
  "combinación en FreGordo"         // Fuente
)
```

---

## 🚨 Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot find module` | Olvido importar | Agregar import al inicio |
| `TypeError: undefined is not a function` | Función mal escrita | Verificar nombre exacto |
| `user_id is not a number` | Pasar string en vez de int | Convertir a número: `Number(userId)` |
| Sin error pero sin notificación | La consulta falló silenciosamente | Revisar logs `[v0]` |

---

## 📊 Estructura de `related_data`

Según el tipo de notificación, `related_data` contiene:

```typescript
// official_results
{
  lotteryName: "Powerball",
  drawDate: "2025-02-15",
  winningNumber: "1234",
  type: "official_results"
}

// prediction_hit
{
  lotteryName: "Powerball",
  predictedNumber: "1234",
  winningNumber: "1234",
  matchType: "exact",
  earnings: 200000,
  type: "prediction_hit"
}

// ranking_change
{
  newRank: 5,
  previousRank: 8,
  accuracyPercentage: 87.5,
  isImprovement: true,
  type: "ranking_change"
}

// service_used
{
  subscriberUsername: "ChanceGuru",
  contractDuration: "monthly",
  lotteryType: "3_digits",
  type: "service_used"
}
```

---

## 🔍 Debugging

### Ver las notificaciones creadas:
```sql
SELECT * FROM notifications 
WHERE user_id = 123 
ORDER BY created_at DESC 
LIMIT 10;
```

### Ver notificaciones no leídas:
```sql
SELECT * FROM notifications 
WHERE is_read = false 
ORDER BY created_at DESC;
```

### Revisar logs en consola:
```
[v0] Notified all users about results for Powerball
[v0] Error notifying official results: [error message]
```

---

## ✅ Checklist para Agregar Nueva Notificación

Si necesitas agregar un nuevo tipo de notificación:

1. **Agrega el tipo** en `NotificationType`:
   ```typescript
   type NotificationType = ... | "mi_nuevo_tipo"
   ```

2. **Crea la función** en `lib/notifications.ts`:
   ```typescript
   export async function notifyMiNuevoTipo(userId: number, data: any) {
     await createNotification(
       userId,
       "mi_nuevo_tipo",
       "Título",
       "Mensaje",
       { ...data }
     )
   }
   ```

3. **Llámala** donde sea necesario:
   ```typescript
   import { notifyMiNuevoTipo } from "@/lib/notifications"
   // ...
   await notifyMiNuevoTipo(userId, data)
   ```

---

## 🎓 Concepto General

**Notificación = Evento → Mensaje al Usuario**

```
Usuario hace algo
    ↓
Evento se activa
    ↓
Función notifyX() se ejecuta
    ↓
Registro en tabla notifications
    ↓
Usuario ve en su centro de notificaciones
```

**Es simple:** Evento → Notificación. Sin excepciones, sin emails aún.

---

## 📞 Soporte

Para preguntas sobre notificaciones:
1. Lee `NOTIFICATION_SYSTEM.md` (documentación completa)
2. Busca ejemplos en los archivos mencionados
3. Revisa los logs `[v0]` en consola
4. Verifica la base de datos directamente

---

**Última actualización:** Febrero 15, 2026  
**Para:** Developers de ForanLot  
**Estado:** ✅ Listo para usar

