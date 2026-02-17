# 🚀 Guía Rápida: Completar Horarios de Loterias

## 3 Pasos Simples

### Paso 1: Abre el Excel
```
📂 c:\foranlot\public\festivos.xlsx
```

Encontrarás una tabla con:
- Nombre de la lotería
- Horarios por tipo de día (laboral, sábado, domingo, festivo)

### Paso 2: Modifica `lib/lotteries.ts`
Busca cada lotería en el archivo y actualiza el objeto `dayTypeHours`.

**Ejemplo:**
```typescript
// ANTES:
{
  name: "Dorado Tarde",
  dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 }
}

// DESPUÉS (si Excel dice distinto):
{
  name: "Dorado Tarde",
  dayTypeHours: { laboral: 15, sabado: 14, domingo: 14, festivo: 16 }
}
```

### Paso 3: Valida tu trabajo
```bash
# Ejecuta el validador
npx ts-node scripts/validate-lottery-hours.ts
```

**Resultado esperado:**
```
✅ VALIDACIÓN EXITOSA: Todos los horarios son válidos
```

---

## 📋 Tipos de Loterias

### Tipo 1: Día Específico (ej: Lunes)
**Ejemplo:** Cundinamarca  
**Campo a llenar:** Solo `laboral`

```typescript
dayTypeHours: { laboral: 23 }
```

**Loterias de este tipo:**
- Cundinamarca (lunes)
- Cauca (sábado)  
- Nariño (viernes)
- Tolima (martes)
- Boyacá (jueves)
- Córdoba (miércoles)

### Tipo 2: Todos los Días
**Ejemplo:** Dorado Tarde  
**Campos a llenar:** `laboral`, `sabado`, `domingo`, `festivo`

```typescript
dayTypeHours: { 
  laboral: 15,      // Lunes a viernes
  sabado: 14,       // Sábado
  domingo: 14,      // Domingo
  festivo: 16       // Día festivo (si se sortea)
}
```

**Loterias de este tipo:**
- Dorado Tarde
- Dorado Noche
- Paisita Día
- Paisita Noche
- Play Four Día
- Play Four Noche
- Etc. (ver lista completa más abajo)

---

## 📑 Lista Completa de Loterias

### Loterias de Día Específico (6 total)

| Lotería | Día | Campo | Hora Actual |
|---------|-----|-------|------------|
| Cundinamarca | Lunes | `laboral` | 23 |
| Cauca | Sábado | `sabado` | 23 |
| Nariño | Viernes | `laboral` | 23 |
| Tolima | Martes | `laboral` | 23 |
| Boyacá | Jueves | `laboral` | 23 |
| Córdoba | Miércoles | `laboral` | 23 |

### Loterias "Todos los Días" (51 total)

Todas necesitan 4 campos: `laboral`, `sabado`, `domingo`, `festivo`

**Lotería de Medellín:**
- Medellín Día
- Medellín Noche
- Medellín Lotería Mata

**Dorado:**
- Dorado Día
- Dorado Tarde
- Dorado Noche

**Paisita:**
- Paisita Día
- Paisita Tarde
- Paisita Noche

**Play Four:**
- Play Four Día
- Play Four Noche

**Cash:**
- Cash 3 Día
- Cash 3 Noche
- Cash 4 Día
- Casj 4 Noche

**Otros (37+ más):**
- La Lotería Nacional
- La Lotería de Santander
- Quindío
- Risaralda
- Huila
- Atlántico
- Etc.

---

## 🎯 Checklist: Qué Hacer

### Antes de empezar:
- [ ] Abre `/public/festivos.xlsx`
- [ ] Lee la hoja de horarios
- [ ] Entiende que hay loterias de día específico y loterias de todos los días

### Mientras llenas:
- [ ] Para loterias de **día específico**: Llena **1 campo** (`laboral`, `sabado`, etc)
- [ ] Para loterias **todos los días**: Llena **4 campos** (laboral, sabado, domingo, festivo)
- [ ] Usa números entre 0-23 o `null` si no se sortea ese día
- [ ] Verifica que los números sean números, no strings ("15" ❌ vs 15 ✅)

### Después de llenar:
- [ ] Guarda `lib/lotteries.ts`
- [ ] Corre el validador: `npx ts-node scripts/validate-lottery-hours.ts`
- [ ] Verifica que diga "✅ VALIDACIÓN EXITOSA"
- [ ] (Opcional) Corre `npm run lint` para otros errores
- [ ] (Opcional) Corre `npm run dev` para probar en desarrollo

---

## ❓ Preguntas Frecuentes

### P: ¿Qué es `laboral`?
**R:** Significa "día laboral". Es decir, **lunes a viernes excepto festivos**.

### P: ¿Qué hago si la lotería no se sortea un día?
**R:** Usa `null`:
```typescript
dayTypeHours: { 
  laboral: 15,
  sabado: 15,
  domingo: null,    // ← No se sortea domingo
  festivo: null     // ← No se sortea en festivos
}
```

### P: ¿Puedo tener diferentes horas para diferente día de la semana dentro de "laboral"?
**R:** No, el sistema actual no lo soporta. Si **realmente** varían, usa la hora más común o crea un promedio.

### P: ¿Qué significa `dias: "todos_dias"`?
**R:** La lotería se sortea **todos los días** (incluyendo sábados, domingos y festivos), pero quizás a **horas diferentes**.

### P: ¿Y si me equivoco en una hora?
**R:** Sin problema:
1. Corrige el número en `lib/lotteries.ts`
2. Guarda el archivo
3. Corre el validador nuevamente
4. Listo, está arreglado

### P: ¿Debo cambiar `time` también?
**R:** **NO**. Deja `time` como está. Solo modifica `dayTypeHours`.

### P: ¿Cuál es la diferencia entre `time` y `dayTypeHours`?
**R:**
- `time` = hora antigua (fallback/por defecto)
- `dayTypeHours` = horas nuevas específicas por día

El sistema usa `dayTypeHours` primero. Si no está definida, usa `time`.

---

## 🔧 Comando Rápido: Validar

Después de hacer cambios, simplemente:
```bash
npx ts-node scripts/validate-lottery-hours.ts
```

Verás:
- ✅ Si todo está bien
- ❌ Si hay errores (con detalles)
- ⚠️ Si hay advertencias (campos faltantes)

---

## 📚 Documentos Relacionados

- **CALENDAR_EXAMPLES_COMPLETE.md** - Ejemplos detallados de cada tipo de lotería
- **CALENDAR_HOLIDAYS_GUIDE.md** - Cómo funciona el sistema de festivos
- **lib/holidays-calendar.ts** - Código del sistema de festivos
- **lib/lotteries.ts** - Lista de todas las loterias (donde haces los cambios)

---

## 💡 Consejo Profesional

**Usa buscar/reemplazar (Ctrl+H en VS Code):**

```
Buscar: "name": "Dorado Tarde"

Te llevará directamente a esa lotería, y entonces cambias:
dayTypeHours: { laboral: 15, sabado: 14, domingo: 14, festivo: 16 }
```

---

## ✅ Validación Final

Cuando termines, tu código verá así:

```typescript
const LOTTERIES = [
  {
    name: "Cundinamarca",
    time: 23,
    country: "Colombia",
    dias: "lunes",
    digits: [3, 4, 5],
    dayTypeHours: { laboral: 23 }  // ✅ Actualizado con Excel
  },
  {
    name: "Dorado Tarde",
    time: 15,
    country: "Colombia",
    dias: "todos_dias",
    digits: [3, 4, 5],
    dayTypeHours: { 
      laboral: 15,  // ✅ Actualizado
      sabado: 14,   // ✅ Actualizado
      domingo: 14,  // ✅ Actualizado
      festivo: 16   // ✅ Actualizado
    }
  },
  // ... más loterias
]
```

---

**Tiempo estimado:** 30-45 minutos para todas las 57 loterias  
**Dificultad:** Muy fácil (búsqueda y reemplazo de números)  
**Crítico:** Sí, estos horarios son usados por todo el sistema

¡Vamos! 🎯

