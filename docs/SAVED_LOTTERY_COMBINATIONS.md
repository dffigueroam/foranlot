# ⚡ Combinaciones de Loterías Guardadas

## Descripción

Los usuarios ahora pueden guardar automáticamente las **últimas 2 combinaciones de loterías** que han usado para publicar pronósticos y reutilizarlas con un solo click.

## Caso de Uso

**Problema**: Muchos usuarios siempre pronostican en las mismas loterías (ej: "Baloto, Cundinamarca, Meta" todos los días).

**Solución**: Se guardan las últimas 2 combinaciones y se muestran como botones rápidos en el formulario de pronósticos.

```
Semana 1: Usuario publica en [Baloto, Cundinamarca, Meta]
         → Se guarda combinación 1

Semana 2: Usuario publica en [Baloto, Cundinamarca, Meta, Boyacá]
         → Se guarda combinación 2

Semana 3: Al hacer click en formulario, usuario ve:
          ⚡ [Baloto, Cundinamarca, Meta, Boyacá] (4 loterías, 4 cifras) - 2 fechas atrás
          ⚡ [Baloto, Cundinamarca, Meta] (3 loterías, 4 cifras) - 7 fechas atrás
          
          Con 1 click: selecciona esa combinación
          + Se cargan las 4 loterías automáticamente
          + Se establece el tipo de cifra correspondiente
```

## Archivos Modificados

### 1. Base de Datos
**Archivo**: `scripts/025_user_lottery_combinations.sql`

**Tabla creada**: `user_lottery_combinations`
```sql
Campos:
- id (FK)
- user_id (FK users)
- lottery_names (TEXT[] - Array)
- digit_type (VARCHAR - ej: "3_digits")
- created_at (timestamp)

UNIQUE: (user_id, lottery_names, digit_type)
```

**Funciones PL/pgSQL**:
- `save_lottery_combination()` - Guarda/actualiza combinación
- `get_user_last_combinations()` - Obtiene últimas 2

### 2. Librería Backend
**Archivo**: `lib/predictions.ts`

**Nuevas funciones**:
```typescript
interface LotteryCombination {
  id: number
  lottery_names: string[]
  digit_type: string
  created_at: string
}

saveLotteryCombination(userId, lotteryNames, digitType)
  → Guarda/actualiza combinación (automático al publicar)

getUserLastCombinations(userId)
  → Obtiene las últimas 2 combinaciones del usuario
```

### 3. Acciones del Servidor
**Archivo**: `app/actions/predictions.ts`

**Cambios**:
- ✅ Importa `saveLotteryCombination`
- ✅ En `submitMultiplePredictions()`: Guarda combinación después de publicar
- ✅ Nueva acción: `getLastLotteryCombinations()`
  - Obtiene las últimas 2 combinaciones del usuario autenticado
  - Retorna: `{ success: true, combinations: LotteryCombination[] }`

### 4. Componente Frontend
**Archivo**: `components/predictions/prediction-form.tsx`

**Cambios**:
- ✅ Importa `getLastLotteryCombinations` y `Clock`, `RotateCcw` icons
- ✅ Estado nuevo: `lastCombinations`, `loadingCombinations`
- ✅ `useEffect` al montar: Carga combinaciones
- ✅ Nueva función: `applyLotteryCombination(combo)`
  - Establece `selectedDigits`
  - Establece `selectedLotteries` con los nombres
- ✅ Nueva sección visual: "Tus últimas combinaciones"
  - Muestra hasta 2 botones
  - Cada botón muestra: "X loterías (Y cifras)" + fecha
  - Click aplica la combinación
  - Mostrado solo si hay combinaciones guardadas

## Flujo de Datos

### Publicar Pronóstico (Guardado automático)

```
Usuario en /dashboard
     ↓
Selecciona: [Baloto, Cundinamarca] + 3 cifras
     ↓
Click "Publicar"
     ↓
submitMultiplePredictions()
     ├─ Crear predicciones en BD ✅
     ├─ saveLotteryCombination(userId, ["Baloto", "Cundinamarca"], "3_digits")
     │  ├─ Si NO existe → INSERT
     │  └─ Si EXISTE → UPDATE created_at (para activar el "últimas")
     └─ revalidatePath() ✅
```

### Usar Combinación Guardada (Lectura rápida)

```
Usuario entra a /dashboard
     ↓
PredictionForm monta
     ↓
useEffect → getLastLotteryCombinations()
     ├─ Query: getUserLastCombinations(userId)
     └─ Retorna: [combo1, combo2]
     ↓
Muestra en UI:
┌──────────────────────────────────────────┐
│ ⏱️ Tus últimas combinaciones              │
│                                          │
│ [⚡ 2 loterías (3 cifras) - 13/02/2026]  │
│ [⚡ 3 loterías (4 cifras) - 11/02/2026]  │
│                                          │
│ Haz click para aplicar la combinación    │
└──────────────────────────────────────────┘
     ↓
Usuario hace click en combo 1
     ↓
applyLotteryCombination()
     ├─ setSelectedDigits("3")
     ├─ setSelectedLotteries(["Baloto|COL", "Cundinamarca|COL", ...])
     └─ selectedCountry se mantiene en "all"
     ↓
UI actualiza:
✅ Tipo de cifra: 3 cifras
✅ Loterías: [Baloto ✓, Cundinamarca ✓]
✅ Listo para ingresar números
```

## Ventajas

✅ **Acelera el flujo**: 1 click vs 10 clics para seleccionar loterías
✅ **Automático**: Se guarda sin acciones adicionales del usuario
✅ **Inteligente**: Guarda la última combinación usada (actualiza fecha)
✅ **Historial corto**: Solo últimas 2 (no ocupa mucho en BD)
✅ **Por tipo de cifra**: Permite múltiples combos (3 cifras vs 4 cifras)

## Límites por Diseño

- ⏱️ Guarda: Última combinación por cada (user, lottery_names, digit_type)
- 📊 Muestra: Máximo 2 combinaciones en UI
- 🔄 Actualiza: Timestamp cada vez que se usa la combinación

## Instalación

1. **Ejecutar migration SQL**:
   ```bash
   psql $DATABASE_URL < scripts/025_user_lottery_combinations.sql
   ```

2. **Verificar tablas**:
   ```sql
   SELECT * FROM user_lottery_combinations LIMIT 1;
   ```

3. **Reiniciar app**:
   ```bash
   npm run dev
   ```

## Testing Manual

1. Ir a `/dashboard`
2. Seleccionar loterías (ej: 3)
3. Ingresar números
4. Publicar pronóstico
5. Volver a `/dashboard`
6. **Verificar**: Debe haber un botón con "3 loterías (X cifras)"
7. Click en botón
8. **Verificar**: Las 3 loterías deben estar marcadas
9. Cambiar a 2 loterías diferentes
10. Publicar
11. Volver
12. **Verificar**: Ahora tiene 2 botones (últimas 2 combinaciones)

## Consideraciones de Rendimiento

✅ Índices en:
- `user_id`
- `user_id, created_at DESC` (para ORDER BY)

✅ Queries rápidas:
- `saveLotteryCombination()`: INSERT ON CONFLICT (muy eficiente)
- `getUserLastCombinations()`: LIMIT 2 (siempre rápido)

✅ Sin impacto:
- Solo 1 llamada por publicación
- Query de lectura: O(1) con LIMIT 2

---

**Estado**: ✅ LISTO PARA EJECUTAR
**Fecha**: Febrero 13, 2026
**Impact**: 🟢 Mejora UX, sin impacto de rendimiento
