# 📌 Ejemplos: Cómo Llenar las Horas por Tipo de Día

## Ejemplo 1: Lotería de Día Específico (Lunes)

### Cundinamarca
**Estructura actual (SIN CAMBIOS):**
```typescript
{
  name: "Cundinamarca",
  time: 23,
  country: "Colombia",
  dias: "lunes",
  digits: [3, 4, 5],
  dayTypeHours: { laboral: 23 }
}
```

**¿Qué significa?**
- ✅ Se sortea cada **lunes** (día laboral)
- ✅ Hora: **23:00 (11 PM)**
- ❌ No se sortea sábado, domingo ni festivo

**Si en Excel dice diferente:**
```typescript
// Si Excel de Cundinamarca dice que sortea a las 21:00 (9 PM):
dayTypeHours: { laboral: 21 }

// Listo, no hay más cambios
```

---

## Ejemplo 2: Lotería de Sábado

### Cauca
**Estructura actual:**
```typescript
{
  name: "Cauca",
  time: 23,
  country: "Colombia",
  dias: "sabado",
  digits: [3, 4, 5],
  dayTypeHours: { sabado: 23 }
}
```

**¿Qué significa?**
- ✅ Se sortea cada **sábado**
- ✅ Hora: **23:00 (11 PM)**

**Si en Excel dice diferente:**
```typescript
// Si Excel de Cauca dice que sortea a las 20:00 (8 PM):
dayTypeHours: { sabado: 20 }
```

---

## Ejemplo 3: Lotería "Todos los Días" - IMPORTANTE

### Dorado Tarde
**Estructura actual (INCOMPLETA):**
```typescript
{
  name: "Dorado Tarde",
  time: 15,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4, 5],
  dayTypeHours: { 
    laboral: 15,   // 3 PM
    sabado: 15,    // 3 PM
    domingo: 15,   // 3 PM
    festivo: 15    // 3 PM
  }
}
```

**¿Qué significa?**
- ✅ Se sortea **cada día** (incluso sábados, domingos y festivos)
- ⏰ Hora: **15:00 (3 PM)** en todos los días

**IMPORTANTE: Necesitas verificar en Excel si la hora es DISTINTA para cada tipo de día**

**Escenario 1: Misma hora todos los días**
```typescript
// Si en Excel sortea siempre a las 3 PM:
dayTypeHours: { 
  laboral: 15,
  sabado: 15,
  domingo: 15,
  festivo: 15
}
// ✅ NO cambies nada, está correcto
```

**Escenario 2: Horas diferentes por tipo de día**
```typescript
// Si en Excel dice:
// - Lunes a viernes: 15:00 (3 PM)
// - Sábado: 14:00 (2 PM)  ← DIFERENTE!
// - Domingo: 14:00 (2 PM) ← DIFERENTE!
// - Festivo: 16:00 (4 PM) ← DIFERENTE!

dayTypeHours: { 
  laboral: 15,   // 3 PM MT-VIE
  sabado: 14,    // 2 PM SAB    ← CAMBIÓ
  domingo: 14,   // 2 PM DOM    ← CAMBIÓ
  festivo: 16    // 4 PM FES    ← CAMBIÓ
}
```

---

## Ejemplo 4: Lotería Nocturna "Todos los Días"

### Paisita Noche
**Estructura actual:**
```typescript
{
  name: "Paisita Noche",
  time: 20,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4, 5],
  dayTypeHours: { 
    laboral: 20,
    sabado: 20,
    domingo: 20,
    festivo: 20
  }
}
```

**Si Excel dice:**
```
Paisita Noche:
- Lunes a Viernes: 20:00 (8 PM)
- Sábado: 20:00 (8 PM)
- Domingo: 21:00 (9 PM)  ← DIFERENTE!
- Festivo: CANCELADA      ← NO SORTEA!
```

**Entonces cambias a:**
```typescript
dayTypeHours: { 
  laboral: 20,      // 8 PM MT-VIE
  sabado: 20,       // 8 PM SAB
  domingo: 21,      // 9 PM DOM    ← CAMBIÓ
  festivo: null     // NO SORTEA   ← CAMBIÓ A NULL
}
```

---

## Ejemplo 5: Lotería con Múltiples Cambios

### Play Four Día
**Estructura actual:**
```typescript
{
  name: "Play Four Dia",
  time: 11,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4],
  dayTypeHours: { 
    laboral: 11,
    sabado: 11,
    domingo: 11,
    festivo: 11
  }
}
```

**Si Excel dice:**
```
Play Four Día:
- Lunes: 11:00 (11 AM)
- Martes: 11:00 (11 AM)
- Miércoles: 12:00 (12 PM) ← DIFERENTE!
- Jueves: 11:00 (11 AM)
- Viernes: 10:00 (10 AM)  ← DIFERENTE!
- Sábado: 11:00 (11 AM)
- Domingo: 11:00 (11 AM)
- Festivo: 11:00 (11 AM)
```

**El sistema es simple: "laboral" = promedio o REALMENTE una sola hora**

Opción A: Si es REALMENTE una hora para todos los laborales:
```typescript
dayTypeHours: { 
  laboral: 11,   // Ojo: esto es para TODOS los laborales
  sabado: 11,
  domingo: 11,
  festivo: 11
}
```

Opción B: Si realmente varían por día de semana y necesitas precisión:
```typescript
// Nota: El sistema actual NO soporta diferencias por día de la semana
// solo por tipo de día (laboral, sábado, domingo, festivo)
// En este caso, usa la hora más común o promedio
```

---

## Checklist: Cómo Completar Cada Lotería

### Para loterias con `dias: "lunes"` o `dias: "sabado"` etc:

```typescript
// 1. Abre Excel y busca la lotería
// 2. Nota la hora (ej: 23)
// 3. Llena SOLO el campo del tipo de día

ANTES:
{ name: "Cundinamarca", days: "lunes", dayTypeHours: { laboral: 23 } }

DESPUÉS:
// Si Excel también dice 23:00, no cambies nada
{ name: "Cundinamarca", days: "lunes", dayTypeHours: { laboral: 23 } } ✅
```

### Para loterias con `dias: "todos_dias"`:

```typescript
// 1. Abre Excel y busca la lotería
// 2. NOTA LAS 4 HORAS:
//    - Lunes a viernes (laboral)
//    - Sábado (sabado)
//    - Domingo (domingo)
//    - Festivo (festivo)
// 3. Llena los 4 campos

ANTES:
{ 
  name: "Dorado Tarde", 
  dayTypeHours: { 
    laboral: 15, 
    sabado: 15, 
    domingo: 15, 
    festivo: 15 
  }
}

DESPUÉS (ejemplo):
{ 
  name: "Dorado Tarde", 
  dayTypeHours: { 
    laboral: 15,   // Revisado en Excel: ✅ 15
    sabado: 14,    // Revisado en Excel: ✅ 14 (era 15)
    domingo: 14,   // Revisado en Excel: ✅ 14 (era 15)
    festivo: 16    // Revisado en Excel: ✅ 16 (era 15)
  }
}
```

---

## 🎯 Tipos de Cambios que Puedes Hacer

### Cambio 1: Actualizar Hora
```typescript
// De:
laboral: 23

// A:
laboral: 21  // Si Excel dice que es a las 9 PM
```

### Cambio 2: Especificar Diferentes Horas
```typescript
// De:
{ laboral: 13, sabado: 13, domingo: 13, festivo: 13 }

// A:
{ laboral: 13, sabado: 12, domingo: 14, festivo: 13 }
```

### Cambio 3: Desactivar Horarios (null)
```typescript
// Si no se sortea en festivos:
festivo: null

// Si no se sortea en domingo:
domingo: null
```

---

## 📊 Tabla de Referencia Rápida

| Nombre | Tipo | Campo a llenar | Ejemplo |
|--------|------|-----------------|---------|
| **Cundinamarca** | Día específico (lunes) | `laboral` | `{ laboral: 23 }` |
| **Cauca** | Día específico (sábado) | `sabado` | `{ sabado: 23 }` |
| **Dorado Tarde** | Todos los días | Todos (4) | `{ laboral: 15, sabado: 14, domingo: 14, festivo: 16 }` |
| **Paisita Noche** | Todos los días | Todos (4) | `{ laboral: 20, sabado: 20, domingo: 21, festivo: null }` |
| **Play Four Día** | Todos los días | Todos (4) | `{ laboral: 11, sabado: 11, domingo: 11, festivo: 11 }` |

---

## ⚠️ Errores Comunes a EVITAR

❌ **ERROR:** Cambiar `time` en lugar de `dayTypeHours`
```typescript
// INCORRECTO:
{ name: "Cundinamarca", time: 21 }  // ❌ No hagas esto

// CORRECTO:
{ name: "Cundinamarca", dayTypeHours: { laboral: 21 } }  // ✅ Así
```

❌ **ERROR:** Olvidar llenar todos los 4 campos en `todos_dias`
```typescript
// INCORRECTO:
{ dayTypeHours: { laboral: 15 } }  // ❌ Falta sabado, domingo, festivo

// CORRECTO:
{ dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 } }  // ✅
```

❌ **ERROR:** Poner horas fuera de rango (0-23)
```typescript
// INCORRECTO:
{ dayTypeHours: { laboral: 24 } }  // ❌ 24 no es válido

// CORRECTO:
{ dayTypeHours: { laboral: 23 } }  // ✅ Máximo 23
```

❌ **ERROR:** Poner strings en lugar de números
```typescript
// INCORRECTO:
{ dayTypeHours: { laboral: "23" } }  // ❌ String

// CORRECTO:
{ dayTypeHours: { laboral: 23 } }    // ✅ Número
```

---

## ✅ Validación: Cómo Revisar tu Trabajo

Después de cambiar las horas, verifica:

```bash
# 1. No hay errores de sintaxis
npm run lint

# 2. Las horas están entre 0 y 23
grep -E "laboral|sabado|domingo|festivo" lib/lotteries.ts | grep -E "[0-9]{2,}" # rango 00-23

# 3. Todas las loterias "todos_dias" tienen 4 campos
grep -A 4 "todos_dias" lib/lotteries.ts | grep -c "laboral"

# 4. El app compila sin errores
npm run build
```

---

**Última actualización:** Febrero 15, 2026  
**Para:** Completar manualmente los horarios de sorteo

