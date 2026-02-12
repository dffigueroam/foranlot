# Sistema de Zonas Horarias para Validación de Predicciones

## Archivo: `lib/timezones.ts`

Este módulo maneja las zonas horarias de las regiones donde operan las loterías y valida que las predicciones se publiquen con la anticipación requerida.

## Regiones Soportadas

| Región | Zona Horaria | Offset UTC | Identificador |
|--------|--------------|------------|---------------|
| **Colombia** | America/Bogota | UTC-5 | `COLOMBIA` |
| **España** | Europe/Madrid | UTC+1/+2* | `ESPAÑA` |
| **USA - New York** | America/New_York | UTC-5/-4* | `USA_NY` |
| **USA - Florida** | America/New_York | UTC-5/-4* | `USA_FLORIDA` |

*Nota: Ajustes por horario de verano (DST) se aplican automáticamente

## Hora de Juego por Lotería

Cada lotería en `lib/lotteries.ts` tiene su propia hora de juego local definida en el campo `time` (formato: hora en 24h):

```typescript
// Ejemplos:
{ name: "Cundinamarca", time: 23, country: "Colombia" }  // 11:00 PM
{ name: "Dorado Tarde", time: 15, country: "Colombia" }  // 3:00 PM
{ name: "Dorado Mañana", time: 10, country: "Colombia" } // 10:00 AM
{ name: "TriplexOnce1", time: 9, country: "España" }     // 9:00 AM
```

El sistema usa automáticamente `lottery.time` para determinar la hora del sorteo al validar predicciones.

## Regla de Publicación

**Las predicciones deben publicarse al menos 1 hora antes del sorteo oficial**

## Funciones Principales

### `canPublishPrediction()`

Valida si una predicción puede ser publicada según la fecha/hora del sorteo y la región.

```typescript
const validation = canPublishPrediction(
  "2026-02-15",      // drawDate
  "21:00",           // drawTime
  "Colombia"         // country
)

if (!validation.allowed) {
  console.error(validation.message)
  // "El sorteo es muy pronto. Debes publicar con al menos 1 hora de anticipación..."
}
```

**Respuesta:**
```typescript
{
  allowed: boolean,
  message?: string,           // Mensaje de error si no está permitido
  remainingMinutes?: number   // Minutos hasta el sorteo
}
```

### `getTimezoneByCountry()`

Obtiene la zona horaria IANA según el nombre del país.

```typescript
const tz = getTimezoneByCountry("Colombia")  // "America/Bogota"
const tz2 = getTimezoneByCountry("España")   // "Europe/Madrid"
```

### `getCurrentTimeInTimezone()`

Obtiene la hora actual en una zona horaria específica.

```typescript
const colombiaTime = getCurrentTimeInTimezone("America/Bogota")
console.log(colombiaTime) // Date object con hora local de Colombia
```

### `formatDateInTimezone()`

Formatea una fecha en formato legible en una zona horaria específica.

```typescript
const formatted = formatDateInTimezone(new Date(), "Europe/Madrid")
// "12/02/2026, 03:45 PM"
```

### `getTimezoneInfo()` 

Obtiene información completa de debugging para una región.

```typescript
const info = getTimezoneInfo("USA")
/*
{
  country: "USA",
  timezone: "America/New_York",
  currentTime: "02/12/2026, 09:45 AM",
  utcTime: "2026-02-12T14:45:00.000Z"
}
*/
```

## Integración con Predictions

La validación está integrada en:

- **`app/actions/predictions.ts`** → `submitPrediction()`
- **`app/actions/predictions.ts`** → `submitMultiplePredictions()`

Antes de crear cualquier predicción, el sistema verifica automáticamente:
1. ✅ Extrae el país de la lotería desde `lib/lotteries.ts`
2. ✅ Determina la zona horaria correcta
3. ✅ Calcula la diferencia entre hora actual (en esa zona) y hora del sorteo
4. ✅ Rechaza si faltan menos de 60 minutos

## Mensajes de Error

| Escenario | Mensaje |
|-----------|---------|
| Menos de 1 hora | "El sorteo es muy pronto. Debes publicar con al menos 1 hora de anticipación. Tiempo restante: X minutos" |
| Sorteo pasado | "El sorteo ya pasó. No puedes publicar predicciones para sorteos pasados" |
| Sin validación | (Permite publicar si no hay hora de sorteo definida) |

## Ejemplo de Flujo Completo

```typescript
// Usuario intenta publicar una predicción
const formData = new FormData()
formData.set("lottery_name", "Cundinamarca")
formData.set("lottery_type", "3_digits")
formData.set("predicted_number", "123")
formData.set("draw_date", "2026-02-15")
// No se especifica draw_time, se usa lottery.time automáticamente
formData.set("confidence_level", "4")

// Server Action: submitPrediction()
const result = await submitPrediction(formData)

// 🔹 Internamente:
// 1. Encuentra lotería en LOTTERIES → { name: "Cundinamarca", time: 23, country: "Colombia" }
// 2. Usa lottery.time = 23 → "23:00" (11:00 PM)
// 3. Obtiene timezone: "America/Bogota" (UTC-5)
// 4. Hora actual en Colombia: 2026-02-15 19:30 (7:30 PM)
// 5. Hora del sorteo: 2026-02-15 23:00 (11:00 PM)
// 6. Diferencia: 210 minutos ✅
// 7. Permitido: SÍ (más de 60 minutos)

// Si el usuario intentara publicar a las 22:30 (10:30 PM):
// Diferencia: 30 minutos ❌
// Rechazado: "El sorteo es muy pronto..."

// Ejemplo con lotería de día:
formData.set("lottery_name", "Dorado Mañana")  // time: 10
// Sorteo a las 10:00 AM
// Si intenta publicar a las 9:30 AM:
// Diferencia: 30 minutos ❌
// Rechazado
```

## Casos Especiales

### 1. Sin Hora de Sorteo
Si `drawTime` es `null`, `"null"` o `"Sin horario"`, la publicación se permite siempre.

### 2. Horario de Verano (DST)
Las zonas horarias de USA y España ajustan automáticamente por horario de verano usando el API `Intl.DateTimeFormat`.

### 3. Múltiples Países
Para predicciones múltiples en diferentes países, se valida usando el **primer país** de la lista de loterías seleccionadas.

## Testing

Para probar la validación:

```typescript
// Caso 1: Lotería nocturna (23:00) - Sorteo en 2 horas (debe permitir)
canPublishPrediction("2026-02-15", "23:00", "Colombia")
// ✅ allowed: true

// Caso 2: Lotería tarde (15:00) - Sorteo en 30 minutos (debe rechazar)
canPublishPrediction("2026-02-15", "15:30", "Colombia")
// ❌ allowed: false, message: "El sorteo es muy pronto..."

// Caso 3: Lotería mañana (10:00) - Sorteo en 90 minutos (debe permitir)
canPublishPrediction("2026-02-15", "10:00", "Colombia")
// ✅ allowed: true (si hora actual es 8:30 AM o antes)

// Caso 4: España - Sorteo ya pasó
canPublishPrediction("2026-02-10", "09:00", "España")
// ❌ allowed: false, message: "El sorteo ya pasó..."

// Caso 5: USA - Diferentes zonas horarias
canPublishPrediction("2026-02-15", "20:00", "USA")
// Valida según UTC-5/-4 (New York timezone)
```

## Mejoras Futuras

- [ ] Cache de zonas horarias para mejor rendimiento
- [ ] Configuración de límite de tiempo ajustable (actualmente fijo en 60 minutos)
- [ ] Notificaciones push cuando falten X minutos para cierre
- [ ] Dashboard de admin mostrando hora de cierre por lotería

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
