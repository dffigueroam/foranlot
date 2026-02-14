# Sistema de Combinaciones de Loterías - Documentación

## Descripción General
El sistema guarda las últimas combinaciones de loterías que cada usuario publica, permitiendo reutilizarlas rápidamente en nuevas predicciones.

---

## Estructura: Dos Sistemas Coexistentes

### 1. **Sistema NUEVO** (Tabla PostgreSQL Nativa)
Usa la tabla `user_lottery_combinations` creada en el script SQL proporcionado.

**Archivos:**
- `lib/lottery-combinations.ts` - Funciones de base de datos
- `app/actions/lottery-combinations.ts` - Server action reutilizable

**Funciones Principales:**
```typescript
// Guardar una combinación de lotería
saveLotteryCombination(userId: number, lotteryNames: string[], digitType: string)
// Devuelve: { success: boolean, combinationId: number }

// Obtener últimas 2 combinaciones del usuario
getUserLastCombinations(userId: number)
// Devuelve: LotteryCombination[]
```

**Se auto-llama cuando:**
- Se crea una predicción en `createPrediction()` en `lib/predictions.ts`
- Guarda automáticamente `[lotteryName]` y `lotteryType` después de insertar

---

### 2. **Sistema ANTIGUO** (En Revisión)
Ya existe en `app/actions/predictions.ts` con funciones como:
- `getLastLotteryCombinations()`
- `toggleFavoriteCombinationAction()`
- `deleteLotteryCombinationAction()`
- `applyCombinationAction()`

**Usado en:**
- `components/predictions/prediction-form.tsx` - Interfaz de selección de combinaciones

---

## Flujo de Almacenamiento (NUEVO)

```
1. Usuario publica predicción con:
   - lottery_name: "Baloto"
   - lottery_type: "3_digits"

2. createPrediction() en lib/predictions.ts
   ↓
3. saveLotteryCombination() se ejecuta automáticamente
   ↓
4. INSERT/UPDATE en user_lottery_combinations
   - Guarda: { user_id, lottery_names: ["Baloto"], digit_type: "3_digits" }
   - Si ya existe esa combo, actualiza created_at (timestamp reciente)
```

---

## Funciones PostgreSQL

Las funciones están definidas en el script SQL bajo funciones PL/pgSQL:

### `save_lottery_combination()`
```sql
-- Normaliza nombres (ordena array para evitar duplicados)
-- Inserta o actualiza timestamp si ya existe
-- Retorna: {success: boolean, combination_id: integer}
```

### `get_user_last_combinations()`
```sql
-- Obtiene últimas 2 combinaciones ordenadas por recencia
-- Retorna: {id, lottery_names, digit_type, created_at}
```

---

## Integración Actual

✅ **Automático al crear predicción:**
```typescript
// En lib/predictions.ts - createPrediction()
if (result.length > 0) {
  await saveLotteryCombination(userId, [lotteryName], lotteryType)
}
```

---

## Próximos Pasos (Recomendados)

1. **Migrar formulario** a usar funciones NUEVAS para sincronizar
2. **Deprecar antiguas** si tienen redundancia
3. **Mostrar en dropdown** las últimas 2-3 combinaciones guardadas

---

## Tablas Relacionadas

```
user_lottery_combinations
├── id (PK)
├── user_id (FK → users)
├── lottery_names (TEXT[] - array de strings)
├── digit_type (VARCHAR: "3_digits", "4_digits", "5_digits")
├── created_at (timestamp)
└── UNIQUE(user_id, lottery_names, digit_type)

Índices:
- idx_user_lottery_combinations_user_id
- idx_user_lottery_combinations_created_at
```

---

## Ejemplo de Uso (Para Frontend)

```typescript
// En componente, llamar:
import { getLastCombinationsAction } from "@/app/actions/lottery-combinations"

const { combinations } = await getLastCombinationsAction()

// combinations será:
[
  {
    id: 1,
    lottery_names: ["Baloto"],
    digit_type: "3_digits",
    created_at: "2026-02-13T..."
  },
  {
    id: 2,
    lottery_names: ["SuperAstro"],
    digit_type: "4_digits",
    created_at: "2026-02-13T..."
  }
]
```

---

**Última actualización:** Febrero 13, 2026
**Estado:** Activo + Coexistente con sistema anterior
