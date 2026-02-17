# 📐 Vista Previa: Loterias Completadas (Ejemplos)

## Cómo se verían después de llenarlas

### Ejemplo 1: Cundinamarca (Día Específico)
```typescript
// ANTES (como está ahora):
{
  name: "Cundinamarca",
  time: 23,
  country: "Colombia",
  dias: "lunes",
  digits: [3, 4, 5],
  dayTypeHours: { laboral: 23 }
},

// DESPUÉS (si verificamos Excel y dice 23:00):
{
  name: "Cundinamarca",
  time: 23,
  country: "Colombia",
  dias: "lunes",
  digits: [3, 4, 5],
  dayTypeHours: { laboral: 23 }  // ✅ Sigue igual (era correcto)
},
```

**¿Qué revisaste?**
1. Abriste Excel
2. Buscaste "Cundinamarca"
3. Viste que se sortea a las 23:00 (lunes)
4. Confirmó que `laboral: 23` es correcto

---

### Ejemplo 2: Dorado Tarde (Todos los Días - Cambio Mínimo)
```typescript
// ANTES (como está ahora):
{
  name: "Dorado Tarde",
  time: 15,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4, 5],
  dayTypeHours: { 
    laboral: 15, 
    sabado: 15, 
    domingo: 15, 
    festivo: 15 
  }
},

// DESPUÉS (descubriste que sábado es diferente):
{
  name: "Dorado Tarde",
  time: 15,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4, 5],
  dayTypeHours: { 
    laboral: 15,     // ✅ Confirmado: MT-VIE 15:00 (3 PM)
    sabado: 14,      // 🔄 CAMBIÓ: Sábado 14:00 (2 PM)
    domingo: 15,     // ✅ Confirmado: Domingo 15:00 (3 PM)
    festivo: 15      // ✅ Confirmado: Festivo 15:00 (3 PM)
  }
},
```

**¿Qué revisaste?**
1. Abriste Excel y buscaste "Dorado Tarde"
2. Revisaste los 4 tipos de día:
   - Lunes a Viernes: 15:00 ✅
   - Sábado: **14:00** ← DIFERENTE ❌
   - Domingo: 15:00 ✅
   - Festivo: 15:00 ✅
3. Actualizaste el campo `sabado` de 15 a 14

---

### Ejemplo 3: Paisita Noche (Todos los Días - Cambios Múltiples)
```typescript
// ANTES (como está ahora):
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
},

// DESPUÉS (Excel mostró cambios significativos):
{
  name: "Paisita Noche",
  time: 20,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4, 5],
  dayTypeHours: { 
    laboral: 20,      // ✅ Confirmado: MT-VIE 20:00 (8 PM)
    sabado: 20,       // ✅ Confirmado: Sábado 20:00 (8 PM)
    domingo: 21,      // 🔄 CAMBIÓ: Domingo 21:00 (9 PM)
    festivo: null     // 🔄 CAMBIÓ: Festivo NO SORTEA
  }
},
```

**¿Qué revisaste?**
1. Excel de "Paisita Noche":
   - Lunes a Viernes: 20:00 ✅
   - Sábado: 20:00 ✅
   - Domingo: **21:00** ← DIFERENTE ❌ (era 20)
   - Festivo: **CANCELADA** ← NO SE SORTEA ❌
2. Actualizaste con los cambios

---

### Ejemplo 4: Play Four Día (Horas Estándar)
```typescript
// ANTES:
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
},

// DESPUÉS (todo igual en Excel):
{
  name: "Play Four Dia",
  time: 11,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4],
  dayTypeHours: { 
    laboral: 11,     // ✅ Confirmado
    sabado: 11,      // ✅ Confirmado
    domingo: 11,     // ✅ Confirmado
    festivo: 11      // ✅ Confirmado
  }
},
```

**¿Qué revisaste?**
1. Excel de "Play Four Día" mostraba la misma hora (11:00) para todos los días
2. Ningún cambio fue necesario

---

### Ejemplo 5: Cauca (Sábado - Cambio de Hora)
```typescript
// ANTES:
{
  name: "Cauca",
  time: 23,
  country: "Colombia",
  dias: "sabado",
  digits: [3, 4, 5],
  dayTypeHours: { sabado: 23 }
},

// DESPUÉS (Excel dice diferente):
{
  name: "Cauca",
  time: 23,
  country: "Colombia",
  dias: "sabado",
  digits: [3, 4, 5],
  dayTypeHours: { sabado: 20 }  // 🔄 CAMBIÓ: 20:00 (8 PM)
},
```

**¿Qué revisaste?**
1. Excel de "Cauca" (que solo se sortea sábados)
2. Viste que es a las 20:00, no 23:00
3. Cambiaste `sabado: 23` a `sabado: 20`

---

### Ejemplo 6: Nariño (Viernes - Sin Cambios)
```typescript
// ANTES:
{
  name: "Nariño",
  time: 23,
  country: "Colombia",
  dias: "viernes",
  digits: [3, 4, 5],
  dayTypeHours: { laboral: 23 }
},

// DESPUÉS (confirmaste Excel):
{
  name: "Nariño",
  time: 23,
  country: "Colombia",
  dias: "viernes",
  digits: [3, 4, 5],
  dayTypeHours: { laboral: 23 }  // ✅ Confirmado, sin cambios
},
```

---

## Tabla de Cambios Típicos

| Lotería | Tipo | Cambios Esperados |
|---------|------|-------------------|
| Cundinamarca | Lunes | Usualmente 0 cambios |
| Cauca | Sábado | Posible cambio en hora |
| Dorado Tarde | Todos | Posible diferencia en sábado/domingo |
| Paisita Noche | Todos | Posible no-sorte en festivos |
| Play Four Día | Todos | Usualmente 0 cambios |
| Medellín Día | Todos | Posible cambio en festivos |

---

## Patroness Comunes en Excel

### Patrón 1: Misma Hora Todos los Días
```
Lotería: Dorado Tarde
MT-VIE: 15:00
SAB:    15:00
DOM:    15:00
FES:    15:00

Código:
dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 }
```

### Patrón 2: Horas Diferentes por Tipo de Día
```
Lotería: Paisita Noche
MT-VIE: 20:00
SAB:    20:00
DOM:    21:00
FES:    CANCELADA

Código:
dayTypeHours: { laboral: 20, sabado: 20, domingo: 21, festivo: null }
```

### Patrón 3: No Sortea Festivos
```
Lotería: Medellín Día
MT-VIE: 14:00
SAB:    14:00
DOM:    14:00
FES:    NO

Código:
dayTypeHours: { laboral: 14, sabado: 14, domingo: 14, festivo: null }
```

### Patrón 4: Cambios Múltiples
```
Lotería: Nariño
MT-VIE: 23:00
SAB:    ERROR (no se sortea)
DOM:    ERROR (no se sortea)
FES:    ERROR (no se sortea)
Es viernes solamente → es "laboral"

Código:
dayTypeHours: { laboral: 23 }
```

---

## Checklist Visual: ¿Lo Hice Bien?

### Para Loterias de Día Específico (ej: Cundinamarca)
```
✅ Tiene 1 campo en dayTypeHours (laboral, sabado, domingo o ninguno especial)
✅ La hora es un número entre 0-23
✅ No tiene 4 campos (eso es para "todos_dias")

Ejemplo CORRECTO:
{ name: "Cundinamarca", dayTypeHours: { laboral: 23 } }

Ejemplo INCORRECTO:
{ name: "Cundinamarca", dayTypeHours: { laboral: 23, sabado: 23, domingo: 23, festivo: 23 } }
                                       ❌ Esto es demasiado, es solo lunes
```

### Para Loterias de Todos los Días (ej: Dorado Tarde)
```
✅ Tiene 4 campos: laboral, sabado, domingo, festivo
✅ Cada campo es un número 0-23 o null
✅ NO tiene campos faltantes

Ejemplo CORRECTO:
{ 
  name: "Dorado Tarde", 
  dayTypeHours: { 
    laboral: 15, 
    sabado: 14, 
    domingo: 14, 
    festivo: 16 
  } 
}

Ejemplo INCORRECTO:
{ 
  name: "Dorado Tarde", 
  dayTypeHours: { 
    laboral: 15,
    sabado: 14
    // ❌ Falta domingo y festivo
  } 
}
```

---

## Errores Comunes Y Cómo Evitarlos

### ❌ Error 1: Usar Strings en lugar de Números
```typescript
// MALO:
dayTypeHours: { laboral: "15" }

// BUENO:
dayTypeHours: { laboral: 15 }
```

### ❌ Error 2: Horas fuera de rango
```typescript
// MALO:
dayTypeHours: { laboral: 25 }  // 25 horas no existe

// BUENO:
dayTypeHours: { laboral: 23 }  // 0-23 es el rango válido
```

### ❌ Error 3: Olvidar campos en "todos_dias"
```typescript
// MALO:
{ 
  dias: "todos_dias",
  dayTypeHours: { laboral: 15 }  // ❌ Faltan los otros 3
}

// BUENO:
{ 
  dias: "todos_dias",
  dayTypeHours: { 
    laboral: 15,
    sabado: 15,
    domingo: 15,
    festivo: 15
  }
}
```

### ❌ Error 4: Cambiar `time` en lugar de `dayTypeHours`
```typescript
// MALO:
{
  time: 21,  // ← Cambiate aquí
  dayTypeHours: { laboral: 15 }
}

// BUENO:
{
  time: 15,  // ← Deja esto como estaba
  dayTypeHours: { laboral: 21 }  // ← Cambia aquí
}
```

---

## Proceso Visual: Paso a Paso

```
1. Abre Excel: /public/festivos.xlsx
   ┌─────────────────────────────┐
   │ Lotería    │ MT-VIE │ SAB │ DOM │ FES │
   │ ─────────────────────────────│
   │ Dorado Tarde│ 15   │ 14 │ 14  │ 16  │
   │ Cundinamarca│ 23   │  - │  -  │  -  │
   │ Paisita Noche│ 20  │ 20 │ 21  │ NO  │
   └─────────────────────────────┘

2. Busca Dorado Tarde en lib/lotteries.ts
   ↓
3. Actualiza su dayTypeHours:
   dayTypeHours: { laboral: 15, sabado: 14, domingo: 14, festivo: 16 }
   
4. Repite para las 57 loterias

5. Corre: npx ts-node scripts/validate-lottery-hours.ts
   ↓
6. ✅ VALIDACIÓN EXITOSA
```

---

**Nota:** Este documento es solo para referencia visual. Los números son ejemplos.  
Tu Excel tiene los valores reales que necesitas usar.

Última actualización: Febrero 15, 2026

