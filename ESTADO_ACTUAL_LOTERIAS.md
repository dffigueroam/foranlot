# 🔍 ESTADO ACTUAL: Estructura de Loterias en `lib/lotteries.ts`

## Vista Previa de Cómo Están Ahora

Este documento muestra exactamente cómo se ven las loterias en `lib/lotteries.ts` ahora mismo, para que veas dónde harás los cambios.

---

## Ejemplos del Código Actual

### Lotería 1: Cundinamarca (Día Específico)

**UBICACIÓN:** lib/lotteries.ts, línea ~50
**ESTADO ACTUAL:**
```typescript
{
  name: "Cundinamarca",
  time: 23,
  country: "Colombia",
  dias: "lunes",
  digits: [3, 4, 5],
  dayTypeHours: { laboral: 23 }
},
```

**TU TAREA:** Verificar en Excel si `laboral: 23` es correcto  
**Si Excel dice 23** → No cambies nada ✅  
**Si Excel dice otra hora** → Cambiar solo el número

---

### Lotería 2: Dorado Tarde (Todos los Días)

**UBICACIÓN:** lib/lotteries.ts, línea ~80
**ESTADO ACTUAL:**
```typescript
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
```

**TU TAREA:** Verificar en Excel los 4 horarios  
**Completitud:** Tiene todos 4 campos ✅  
**Lo que podrías cambiar:**
```typescript
// Ejemplo: Si Excel dice horas diferentes
dayTypeHours: { 
  laboral: 15,   // Excel: MT-VIE = 15 ✅
  sabado: 14,    // Excel: SAB = 14 (cambiar de 15 a 14)
  domingo: 14,   // Excel: DOM = 14 (cambiar de 15 a 14)
  festivo: 16    // Excel: FES = 16 (cambiar de 15 a 16)
}
```

---

### Lotería 3: Paisita Noche (Todos los Días)

**UBICACIÓN:** lib/lotteries.ts, línea ~120
**ESTADO ACTUAL:**
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
},
```

**TU TAREA:** Verificar en Excel los 4 horarios  
**Frecuente:** A veces no se sortea en festivos

```typescript
// Si Excel dice que Paisita Noche NO se sortea en festivos:
dayTypeHours: { 
  laboral: 20, 
  sabado: 20, 
  domingo: 20, 
  festivo: null  // ← Cambiar a null (no sortea)
}
```

---

### Lotería 4: Medellín Día (Todos los Días)

**UBICACIÓN:** lib/lotteries.ts, línea ~160
**ESTADO ACTUAL:**
```typescript
{
  name: "Medellín Día",
  time: 14,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4, 5],
  dayTypeHours: { 
    laboral: 14, 
    sabado: 14, 
    domingo: 14, 
    festivo: 14 
  }
},
```

**TU TAREA:** Verificar en Excel

---

### Lotería 5: Cauca (Día Específico - Sábado)

**UBICACIÓN:** lib/lotteries.ts, línea ~75
**ESTADO ACTUAL:**
```typescript
{
  name: "Cauca",
  time: 23,
  country: "Colombia",
  dias: "sabado",
  digits: [3, 4, 5],
  dayTypeHours: { sabado: 23 }
},
```

**TU TAREA:** Verificar si `sabado: 23` es correcto en Excel

---

## Estructura Completa de Una Lotería

```typescript
{
  // 1. Nombre identificador
  name: "AQUI_VA_NOMBRE",

  // 2. Hora antigua (fallback, NO TOQUES)
  time: 15,

  // 3. País
  country: "Colombia",

  // 4. Días en que se sortea
  dias: "lunes" | "martes" | "todos_dias" | ... ,

  // 5. Tipos de dígitos permitidos
  digits: [3, 4, 5],

  // 6. ESTO ES LO QUE CAMBIAS:
  dayTypeHours: {
    // Para loterias "día específico": 1 campo
    laboral: 23,        // Si es lunes, martes, miercoles, jueves, viernes
    
    // Para loterias "todos_dias": TODOS estos 4 campos
    sabado: 23,
    domingo: 23,
    festivo: 23
  }
}
```

---

## ✏️ Área de Cambio: dayTypeHours

### NO TOQUES:
```typescript
✗ name: "Dorado Tarde"        // NO TOQUES
✗ time: 15                     // NO TOQUES
✗ country: "Colombia"          // NO TOQUES
✗ dias: "todos_dias"           // NO TOQUES
✗ digits: [3, 4, 5]            // NO TOQUES
```

### SÍ TOCA AQUÍ:
```typescript
✓ dayTypeHours: {
    laboral: 15,   // ← SOLO ESTOS NÚMEROS
    sabado: 15,    // ← PUEDES CAMBIAR
    domingo: 15,   // ← SEGÚN EXCEL
    festivo: 15
  }
```

---

## 🎯 Patrón de Cambio Ejemplo

### Paso a Paso de UNA Lotería

```
# INICIO: Así está ahorita en lib/lotteries.ts
{
  name: "Dorado Tarde",
  time: 15,
  country: "Colombia",
  dias: "todos_dias",
  digits: [3, 4, 5],
  dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 }
}

# USUARIO: Abre Excel y lee estos valores
# Excel dice:
#   MT-VIE: 15
#   SAB:    14  ← DIFERENTE
#   DOM:    14  ← DIFERENTE
#   FES:    16  ← DIFERENTE

# USUARIO: Modifica los números
{
  name: "Dorado Tarde",  ← SIN CAMBIAR
  time: 15,              ← SIN CAMBIAR
  country: "Colombia",   ← SIN CAMBIAR
  dias: "todos_dias",    ← SIN CAMBIAR
  digits: [3, 4, 5],     ← SIN CAMBIAR
  dayTypeHours: { 
    laboral: 15,         ← SIN CAMBIAR (era 15, sigue siendo 15)
    sabado: 14,          ← CAMBIO (era 15, ahora 14)
    domingo: 14,         ← CAMBIO (era 15, ahora 14)
    festivo: 16          ← CAMBIO (era 15, ahora 16)
  }
}

# RESULTADO: Cambios completados para esta lotería ✅
```

---

## 📍 Dónde Editar en VS Code

### Método 1: Buscar por Nombre (RECOMENDADO)

```
1. Abre VS Code
2. Presiona: Ctrl + F (Buscar)
3. Escribe: "Dorado Tarde"
4. Presiona Enter
5. Te lleva al código
6. Cambias los números en dayTypeHours
7. Guardas con Ctrl + S
8. Repites para las próximas 56 loterias
```

### Método 2: Buscar y Reemplazar (Para Cambios Globales)

```
1. Abre VS Code
2. Presiona: Ctrl + H (Buscar y Reemplazar)
3. Busca: sabado: 15
4. Reemplaza: sabado: 14
5. Reemplaza uno por uno (no "Replace All" sin verificar)
```

### Método 3: Edición Manual

```
1. Abre lib/lotteries.ts
2. Busca la línea del LOTTERIES array
3. Scrollea hasta encontrar la lotería
4. Edita los números directamente
5. Repite para cada lotería
```

---

## ⚠️ Errores Comunes Mientras Editas

### Error 1: Borrar Accidentalmente Comas
```typescript
// ❌ INCORRECTO:
dayTypeHours: { laboral: 15 sabado: 14 }
//                         ↑ Falta la coma

// ✅ CORRECTO:
dayTypeHours: { laboral: 15, sabado: 14 }
//                         ^ Hay coma
```

### Error 2: Cambiar Strings
```typescript
// ❌ INCORRECTO:
dayTypeHours: { laboral: "15" }  // Es string

// ✅ CORRECTO:
dayTypeHours: { laboral: 15 }    // Es número
```

### Error 3: Olvidar Cerrar Llaves
```typescript
// ❌ INCORRECTO:
dayTypeHours: { laboral: 15, sabado: 14, domingo: 14  // Falta }
```

### Error 4: Cambiar Más de Lo Necesario
```typescript
// ❌ INCORRECTO:
{
  name: "Dorado Tarde",      // ← NO CAMBIES ESTO
  time: 19,                  // ← NO CAMBIES ESTO
  dayTypeHours: { ... }      // ← Solo aquí
}

// ✅ CORRECTO:
{
  name: "Dorado Tarde",      // Igual que antes
  time: 15,                  // Igual que antes
  dayTypeHours: { laboral: 15, sabado: 14, ... }  // Solo aquí cambias
}
```

---

## 🔧 Herramientas Útiles en VS Code

### Indentación Automática
```
Selecciona el bloque → Alt + Shift + F
(O: Ctrl + Shift + P → Format Document)
```

### Buscar Errores de Syntax
```
Panel Izquierdo → Errores (rojo X)
Mostrará exactamente dónde hay problemas
```

### Validar Manualmente
```
Abre Terminal → npm run lint
Mostrará todos los errores de TypeScript
```

---

## 📋 Checklist: Antes de Hacer Cambios

- [ ] Tengo lib/lotteries.ts abierto
- [ ] Tengo Excel abierto al lado
- [ ] Entiendo la diferencia entre `laboral`, `sabado`, `domingo`, `festivo`
- [ ] Entiendo que NO debo cambiar `name`, `time`, `dias`, etc
- [ ] Solo cambio los NÚMEROS dentro de `dayTypeHours: { ... }`
- [ ] Entiendo que algunos campos pueden ser `null`

---

## 📊 Resumen Visual

```
lib/lotteries.ts
│
├─ LOTTERIES = [
│
├─ Lotería 1: Cundinamarca
│  ├─ name: "Cundinamarca"          ← NO CAMBIES
│  ├─ time: 23                       ← NO CAMBIES
│  ├─ dias: "lunes"                  ← NO CAMBIES
│  └─ dayTypeHours: {                ← CAMBIAS AQUÍ
│     └─ laboral: 23                 ← SOLO NÚMEROS
│
├─ Lotería 2: Dorado Tarde
│  ├─ name: "Dorado Tarde"           ← NO CAMBIES
│  ├─ time: 15                       ← NO CAMBIES
│  ├─ dias: "todos_dias"             ← NO CAMBIES
│  └─ dayTypeHours: {                ← CAMBIAS AQUÍ
│     ├─ laboral: 15                 ← SOLO NÚMEROS
│     ├─ sabado: 15                  ← SOLO NÚMEROS
│     ├─ domingo: 15                 ← SOLO NÚMEROS
│     └─ festivo: 15                 ← SOLO NÚMEROS
│
├─ Lotería 3: ... (55 más)
│  ...
│
└─ ]
```

---

## 🚀 Listo para Comenzar

Cuando entiendas esta estructura, estás 100% listo para:

1. ✅ Abre Excel
2. ✅ Abre VS Code (lib/lotteries.ts)
3. ✅ Busca cada lotería
4. ✅ Cambia solo los números en `dayTypeHours`
5. ✅ Valida con: `npx ts-node scripts/validate-lottery-hours.ts`

---

**Próximo paso:** Abre CALENDARIO_PASO_A_PASO.md y comienza

