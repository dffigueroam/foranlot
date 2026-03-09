# 🚀 Combinaciones de Loterías - Resumen Rápido

## ¿Qué es?

Los usuarios pueden guardar automáticamente **las últimas 2 combinaciones de loterías** que usan para pronósticos y aplicarlas con **1 CLICK**.

## Ejemplo Real

```
DÍA 1: Usuario publica en [Baloto, Cundinamarca, Meta] + 3 cifras
       → Se guarda automáticamente

DÍA 7: Usuario vuelve al formulario
       → VE: Botón "3 loterías (3 cifras) - hace 7 días"
       → CLICK: Las 3 loterías se cargan en 1 segundo

TÍPICO ANTES: 15 clics (país, cifra, lotería 1, 2, 3 + cada una)
CON ESTO: 1 click ⚡
```

## Lo que se Implementó

| Elemento | Detalles |
|---|---|
| **BD** | Nueva tabla: `user_lottery_combinations` (id, user_id, lottery_names[], digit_type, created_at) |
| **Guards** | 2 funciones PL/pgSQL: `save_lottery_combination()`, `get_user_last_combinations()` |
| **Api** | 2 funciones en `lib/predictions.ts`: saveLotteryCombination(), getUserLastCombinations() |
| **Actions** | Nueva acción: `getLastLotteryCombinations()` |
| **Frontend** | Sección visual en `PredictionForm` mostrando últimas 2 combos |

## ¿Cómo Funciona?

### Parte 1: GUARDAR (automático)
```
Usuario publica pronóstico
         ↓
submitMultiplePredictions() ejecuta
         ↓
saveLotteryCombination(userId, ["Baloto", "Cundinamarca"], "3_digits")
         ↓
BD: INSERT o UPDATE (si ya existe)
```

### Parte 2: MOSTRAR (al entrar)
```
Usuario abre /dashboard
         ↓
PredictionForm monta
         ↓
getLastLotteryCombinations() carga combinaciones
         ↓
Muestra en UI:
  ⚡ [3 loterías, 4 cifras] - Hace 2 días
  ⚡ [2 loterías, 3 cifras] - Hace 7 días
         ↓
Usuario hace click
         ↓
applyLotteryCombination() carga todacombinación
  - setSelectedDigits() 
  - setSelectedLotteries()
```

## Código Clave

### 1. Guardar (al publicar)
```typescript
// app/actions/predictions.ts - submitMultiplePredictions()
await saveLotteryCombination(user.id, lotteryNames, lotteryType)
```

### 2. Cargar (al abrir formulario)
```typescript
// components/predictions/prediction-form.tsx
useEffect(() => {
  const result = await getLastLotteryCombinations()
  setLastCombinations(result.combinations)
}, [])
```

### 3. Aplicar (al hacer click)
```typescript
const applyLotteryCombination = (combo: LotteryCombination) => {
  setSelectedDigits(combo.digit_type.split("_")[0])
  
  const lotteryKeys = combo.lottery_names.map(name => {
    const lottery = LOTTERIES.find(l => l.name === name)
    return `${name}|${lottery.country}`
  })
  
  setSelectedLotteries(new Set(lotteryKeys))
}
```

## Archivos a Compilar

```
✅ scripts/025_user_lottery_combinations.sql
✅ lib/predictions.ts (nuevas funciones)
✅ app/actions/predictions.ts (guardar + obtener)
✅ components/predictions/prediction-form.tsx (UI + lógica)
```

## Instalación

### 1. Ejecutar SQL

```bash
psql $DATABASE_URL < scripts/025_user_lottery_combinations.sql
```

**Verifica:**
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_lottery_combinations';
-- Debe retornar: 1
```

### 2. Tu código ya está listo

El código TypeScript/React ya está en:
- `lib/predictions.ts`
- `app/actions/predictions.ts`
- `components/predictions/prediction-form.tsx`

### 3. Prueba

1. Abre `/dashboard`
2. Selecciona 3 loterías
3. Publica pronóstico
4. Vuelve a `/dashboard`
5. **Debe aparecer** un botón "3 loterías (X cifras)"
6. Click → Las loterías se cargan ✅

## UI Visual

```
┌─────────────────────────────────────────────┐
│ ⏱️ Tus últimas combinaciones                  │
├─────────────────────────────────────────────┤
│                                             │
│ [⚡ 4 loterías (3 cifras) - 13/02/2026]    │
│ [⚡ 2 loterías (4 cifras) - 11/02/2026]    │
│                                             │
│ Haz click para aplicar la combinación       │
│                                             │
└─────────────────────────────────────────────┘
       ↓ CLICK
    
RESULTADO:
✅ Cifra: 3 cifras
✅ Loterías: [Baloto ✓, Cundinamarca ✓, Meta ✓, Boyacá ✓]
✅ Listo para ingresar números
```

## Por Qué Esto Es Útil

| Usuario | Beneficio |
|---------|-----------|
| **Asiduo** | Publica en mismas loterías → Guarda combo → 1 click después |
| **Multi-lotería** | Prueba diferentes combos → Las mantiene a mano |
| **Móvil** | Interfaz más ágil en pantalls pequeñas |
| **Rápido** | Enfoque: números, no configuración |

## Detalles Técnicos

**¿Cuándo se guarda?**
- Después de publicar pronóstico exitosamente
- Con `saveLotteryCombination()` (automático)

**¿Qué se guarda?**
- Array de nombres de loterías
- Tipo de cifra (ej: "3_digits")
- Timestamp actual

**¿Cuántas combinaciones?**
- Máximo 2 mostradas
- Pero se pueden tener múltiples en BD
- Orden: Más recientes primero

**¿Duplicados?**
- NO: UNIQUE(user_id, lottery_names, digit_type)
- Si publica la misma combo 2 veces, solo actualiza fecha

---

**Estado**: ✅ LISTO
**Próximo paso**: `psql $DATABASE_URL < scripts/025_user_lottery_combinations.sql`
