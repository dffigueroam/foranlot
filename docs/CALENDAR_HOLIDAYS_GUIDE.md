# 📅 Sistema de Calendario de Festivos y Horarios de Sorteo

## Overview

Se ha creado un sistema completo para:
1. **Identificar tipos de días** en Columbia (laboral, sábado, domingo, festivo)
2. **Gestionar festivos nacionales** por país
3. **Asociar horarios diferentes** de sorteo según el tipo de día
4. **Validar horarios** según festivos y fines de semana

---

## 📁 Archivos Creados/Modificados

### 1. **`lib/holidays-calendar.ts`** ✨ (NUEVO)
Sistema completo de gestión de festivos.

**Características:**
- 30+ festivos de Colombia (2025-2026)
- Función para determinar tipo de día (laboral, sábado, domingo, festivo)
- Búsqueda de festivos próximos
- Generación de resumen de días por rango

**Funciones principales:**
```typescript
getDayType(date, country)           // → "laboral" | "sabado" | "domingo" | "festivo"
isHoliday(date, country)           // → boolean
isWeekend(date)                    // → boolean
getHolidayName(date, country)      // → string | null
getUpcomingHolidays(country, days) // → Holiday[]
getDaySummary(start, end, country) // → DaySummary[]
```

### 2. **`lib/lotteries.ts`** (MODIFICADO)
Ahora soporta horarios por tipo de día.

**Cambios:**
- ✅ Nuevo tipo: `DayTypeHours` interface
- ✅ Nuevo campo: `dayTypeHours` en cada lotería
- ✅ Nuevas funciones: `getLotteryHour()`, `getLotteryHourForDate()`
- ✅ Retrocompatible: El campo `time` sigue funcionando como fallback

**Ejemplo de estructura:**
```typescript
{
  name: "Cundinamarca",
  time: 23,                                    // Default fallback
  country: "Colombia",
  dias: "lunes",
  digits: [3, 4, 5],
  dayTypeHours: {
    laboral: 23,    // Lunes a viernes (excepto festivos)
    sabado: null,   // No se sortea o diferente hora
    domingo: null,  // No se sortea o diferente hora
    festivo: null   // No se sortea o diferente hora
  }
}
```

---

## 🎯 Cómo Usar: Paso a Paso

### Paso 1: Identificar Tipos de Lotería

Las loterias en Colombia se dividen en:

**A) Loterias por Día Específico:**
- Ej: "Cundinamarca" (solo *lunes*)
- Ej: "Cauca" (solo *sábado*)

Para estas: **Solo especificar la hora del día en que se sortea**

```typescript
{
  name: "Cauca",
  dias: "sabado",
  dayTypeHours: {
    sabado: 23    // Sortea a las 11 PM los sábados
  }
}
```

**B) Loterias "Todos los Días":**
- Ej: "Dorado Tarde"
- Ej: "Paisita Noche"

Para estas: **Especificar 4 horas diferentes según tipo de día**

```typescript
{
  name: "Dorado Tarde",
  dias: "todos_dias",
  dayTypeHours: {
    laboral: 15,   // 3 PM lunes-viernes (excepto festivos)
    sabado: 15,    // 3 PM sábados
    domingo: 15,   // 3 PM domingos
    festivo: 15    // 3 PM festivos
  }
}
```

---

## 📝 Guía: Llenar Manualmente las Horas

### Paso 2A: Para Loterias de Día Específico

**Instrucción:** Encuentra la hora correcta en el Excel `festivos.xlsx`

1. Abre `/public/festivos.xlsx`
2. Busca la lotería en la columna de loterias
3. Encuentra la hora de sorteo
4. Llena el campo correspondiente al tipo de día

**Ejemplo:**
```typescript
// ANTES:
{ name: "Cundinamarca", time: 23, dias: "lunes", dayTypeHours: { laboral: 23 } }

// DESPUÉS (si la hora es diferente):
{ name: "Cundinamarca", time: 23, dias: "lunes", dayTypeHours: { laboral: 18 } }
// ^ Cambié de 23 a 18 si en Excel dice que es a las 6 PM
```

---

### Paso 2B: Para Loterias "Todos los Días"

**Instrucción:** Buscar en Excel para CADA tipo de día

1. Abre `/public/festivos.xlsx`
2. Busca la lotería y sus horarios en diferentes días
3. Toma nota de:
   - Hora lunes-viernes
   - Hora sábado
   - Hora domingo
   - Hora festivo

**Ejemplo:**
```typescript
// ANTES (todos iguales):
{
  name: "Dorado Tarde",
  dayTypeHours: {
    laboral: 15,
    sabado: 15,
    domingo: 15,
    festivo: 15
  }
}

// DESPUÉS (si Excel indica horas diferentes):
{
  name: "Dorado Tarde",
  dayTypeHours: {
    laboral: 15,   // 3 PM MT-VIE
    sabado: 14,    // 2 PM SAB
    domingo: 14,   // 2 PM DOM
    festivo: 16    // 4 PM FES
  }
}
```

---

## 🔍 Referencia: Tipos de Día

| Tipo | Cuándo | Ejemplos |
|------|--------|----------|
| **laboral** | Lunes a viernes (excepto festivos) | Cualquier martes que no sea festivo |
| **sabado** | Todos los sábados | 15 de febrero 2025 |
| **domingo** | Todos los domingos | 16 de febrero 2025 |
| **festivo** | Días festivos nacionales | 25 de diciembre (Navidad), 1 de enero (Año Nuevo) |

---

## 📋 Festivos de Colombia Incluidos

### 2025
```
01 de Enero    → Año Nuevo
06 de Enero    → Reyes Magos
05 de Marzo    → Miércoles de Ceniza
10 de Abril    → Jueves Santo
11 de Abril    → Viernes Santo
01 de Mayo     → Día del Trabajo
02 de Junio    → Corpus Christi
09 de Junio    → Sagrado Corazón
07 de Julio    → San Pedro y San Pablo
07 de Agosto   → Batalla de Boyacá
15 de Agosto   → Asunción de la Virgen
01 de Noviembre→ Día de Todos los Santos
17 de Noviembre→ Independencia de Cartagena
08 de Diciembre→ Inmaculada Concepción
25 de Diciembre→ Navidad
```

### 2026
```
01 de Enero    → Año Nuevo
05 de Enero    → Reyes Magos
25 de Febrero  → Miércoles de Ceniza
30 de Marzo    → Jueves Santo
31 de Marzo    → Viernes Santo
01 de Mayo     → Día del Trabajo
21 de Mayo     → Corpus Christi
28 de Mayo     → Sagrado Corazón
06 de Julio    → San Pedro y San Pablo
07 de Agosto   → Batalla de Boyacá
17 de Agosto   → Asunción de la Virgen
02 de Noviembre→ Día de Todos los Santos
16 de Noviembre→ Independencia de Cartagena
08 de Diciembre→ Inmaculada Concepción
25 de Diciembre→ Navidad
```

---

## 💻 Código: Ejemplos de Uso

### Obtener tipo de día
```typescript
import { getDayType } from "@/lib/holidays-calendar"

const hoy = new Date() // 2026-02-14 (sábado)
const tipo = getDayType(hoy, "Colombia")
console.log(tipo) // → "sabado"
```

### Obtener hora de sorteo
```typescript
import { LOTTERIES, getLotteryHour } from "@/lib/lotteries"

const cundinamarca = LOTTERIES.find(l => l.name === "Cundinamarca")
const hora = getLotteryHour(cundinamarca, "laboral")
console.log(hora) // → 23 (11 PM)
```

### Obtener hora para una fecha específica
```typescript
import { getLotteryHourForDate } from "@/lib/lotteries"

const fecha = new Date("2026-12-25") // Navidad
const dorado = LOTTERIES.find(l => l.name === "Dorado Tarde")
const hora = await getLotteryHourForDate(dorado, fecha, "Colombia")
console.log(hora) // → Hora asignada para festivos
```

### Verificar si es festivo
```typescript
import { isHoliday, getHolidayName } from "@/lib/holidays-calendar"

const navidad = new Date("2026-12-25")
console.log(isHoliday(navidad, "Colombia")) // → true
console.log(getHolidayName(navidad, "Colombia")) // → "Navidad"
```

### Obtener próximos festivos
```typescript
import { getUpcomingHolidays } from "@/lib/holidays-calendar"

const proximos = getUpcomingHolidays("Colombia", 30)
console.log(proximos)
// [
//   { date: "2026-03-05", name: "Miércoles de Ceniza", ... },
//   { date: "2026-04-10", name: "Jueves Santo", ... },
//   ...
// ]
```

---

## 🎬 Workflow Completo

### 1. Verificar Festivos Próximos
```typescript
const proximos = getUpcomingHolidays("Colombia", 7)
// Ver qué festivos hay esta semana
```

### 2. Determinar Tipo de Día para Una Predicción
```typescript
const fecha = new Date("2026-02-14") // Una fecha
const tipo = getDayType(fecha, "Colombia")

if (tipo === "festivo") {
  console.log(`Es ${getHolidayName(fecha, "Colombia")}`)
}
```

### 3. Obtener Hora Correcta de Sorteo
```typescript
const dorado = LOTTERIES.find(l => l.name === "Dorado Tarde")
const hora = await getLotteryHourForDate(dorado, fecha, "Colombia")

// Ahora usar esta hora para validaciones, notificaciones, etc.
```

---

## 🔧 Próximas Mejoras

1. **[ ] Agregar más países:**
   - España (variaciones por región)
   - USA (variaciones por estado)

2. **[ ] Sincronizar con Excel:**
   - Leer directamente desde `/public/festivos.xlsx`
   - Actualizar automáticamente

3. **[ ] API Endpoint:**
   - GET `/api/holidays/colombia` → Todos los festivos
   - GET `/api/holidays/colombia/2026-02-14` → Tipo de día específico

4. **[ ] UI Dashboard:**
   - Calendario visual de festivos
   - Editor para cambiar horas
   - Visualización de horarios por lotería

---

## ✅ Checklist: Completar Implementación

- [ ] Abre `/public/festivos.xlsx`
- [ ] Para cada lotería de día específico (Cundinamarca, Cauca, etc.):
  - [ ] Busca la hora en Excel
  - [ ] Llena el campo `dayTypeHours` correspondiente
- [ ] Para cada lotería "todos_dias":
  - [ ] Busca 4 horas (laboral, sábado, domingo, festivo)
  - [ ] Llena los 4 campos en `dayTypeHours`
- [ ] Guarda cambios en `lib/lotteries.ts`
- [ ] Test: Corre `npm run dev` sin errores
- [ ] Test: Verifica que las notificaciones usen las horas correctas

---

## 📊 Estructura de Datos

### `DayTypeHours` Interface
```typescript
export interface DayTypeHours {
  laboral?: number    // Hora para días laborales
  sabado?: number     // Hora para sábados
  domingo?: number    // Hora para domingos
  festivo?: number    // Hora para festivos
}
```

### `Lottery` Type (Actualizado)
```typescript
{
  name: string
  time: number            // Fallback por defecto
  country: string
  dias: string
  digits: number[]
  dayTypeHours?: DayTypeHours  // NUEVO
}
```

---

## 🚀 Próximos Pasos

1. Abre el archivo Excel `/public/festivos.xlsx`
2. Para cada lotería, anota las horas según tipo de día
3. Modifica `/lib/lotteries.ts` con las horas correctas
4. Verifica que todo funciona sin errores
5. Las notificaciones y validaciones usarán automáticamente estas horas

---

**Fecha:** Febrero 15, 2026  
**Status:** ✅ Sistema listo para llenar horas manualmente

