# ⚡ QUICK START: 2 Minutos para Entender TODO

## 🎯 EL OBJETIVO
Cambiar los horarios de 57 loterias en `lib/lotteries.ts` con datos de `/public/festivos.xlsx`

---

## 📋 LO QUE HAY QUE HACER

### Solo 3 Cosas:

```
1. 📂 ABRE: /public/festivos.xlsx
2. 📝 CAMBIA: Los números en lib/lotteries.ts  
3. ✅ VALIDA: npx ts-node scripts/validate-lottery-hours.ts
```

---

## 🔢 ENTENDER LA ESTRUCTURA

### Tipo 1: Día Específico (ej: Lunes)
```typescript
// Cambiar esto:
dayTypeHours: { laboral: 23 }
//             Una sola línea ↑ (el número)
```

### Tipo 2: Todos los Días
```typescript
// Cambiar esto:
dayTypeHours: { 
  laboral: 15,    // Lunes-Viernes
  sabado: 15,     // Sábado
  domingo: 15,    // Domingo
  festivo: 15     // Festivo (o null si no se sortea)
}
```

---

## 📊 EJEMPLOS RÁPIDOS

### Ejemplo 1: Dorado Tarde
**Excel dice:** MT-VIE=15, SAB=14, DOM=14, FES=16

**Cambias de:**
```typescript
dayTypeHours: { laboral: 15, sabado: 15, domingo: 15, festivo: 15 }
```

**A:**
```typescript
dayTypeHours: { laboral: 15, sabado: 14, domingo: 14, festivo: 16 }
```

---

## ⏱️ TIEMPO ESTIMADO
- Leer documentación: 15 min
- Actualizar loterias: 45 min
- Validar: 2 min
- **Total: ~60 minutos**

---

## 📚 DOCUMENTACIÓN (elige uno)

| Tiempo | Lee | Para |
|--------|-----|------|
| **2 min** | Este doc | Entender qué hacer |
| **10 min** | CALENDARIO_PASO_A_PASO.md | Instrucciones paso a paso |
| **20 min** | EJEMPLOS_LOTERIAS_COMPLETADAS.md | Ver ejemplos reales |
| **30 min** | CALENDAR_EXAMPLES_COMPLETE.md | Referencia detallada |
| **Consulta** | ESTADO_ACTUAL_LOTERIAS.md | Cómo se ve el código ahora |

---

## ✅ CHECKLIST FINAL

- [ ] Abierto `/public/festivos.xlsx`
- [ ] Abierto `lib/lotteries.ts` en VS Code
- [ ] Abierto "CALENDAR_PASO_A_PASO.md" para referencia
- [ ] Empecé a actualizar la primera lotería
- [ ] Corro: `npx ts-node scripts/validate-lottery-hours.ts` después
- [ ] Veo: ✅ VALIDACIÓN EXITOSA
- [ ] ¡LISTO!

---

## 🚀 COMIENZA AHORA

➜ Abre: **CALENDARIO_PASO_A_PASO.md**

---

**Eso es todo. No hay más complicaciones. Solo números a cambiar. ¡Vamos!**

