# Sistema de Scores por Combinaciones

## Descripción General

ForanLot implementa un sistema de puntuación por combinaciones/permutaciones de números para loterías de 3 y 4 cifras. Esto recompensa a usuarios que predicen los dígitos correctos aunque no estén en el orden exacto.

## Reglas de Puntuación

### Tipos de Coincidencia

| Tipo | Descripción | Score | is_correct | Ejemplo |
|------|-------------|-------|------------|---------|
| **exact** | Número exacto coincide | 0 pts* | `true` | Predicción: 1234, Resultado: 1234 |
| **combination** | Mismos dígitos, orden diferente | 2-4 pts | `false` | Predicción: 4321, Resultado: 1234 |
| **no_match** | Sin coincidencia | 0 pts | `false` | Predicción: 5678, Resultado: 1234 |

*Los aciertos exactos marcan `is_correct=true` pero `match_score=0` porque ya reciben el beneficio completo.

### Distribución de Puntos

- **4 cifras combinadas**: 4 puntos
  - Ejemplo: Resultado oficial = 1234, Predicción = 4321 → +4 pts
- **3 cifras combinadas**: 2 puntos
  - Ejemplo: Resultado oficial = 456, Predicción = 564 → +2 pts

## Implementación Técnica

### Base de Datos

**Nuevos campos en `predictions`:**
```sql
ALTER TABLE predictions
ADD COLUMN match_type VARCHAR(20) DEFAULT 'no_match',
ADD COLUMN match_score INTEGER DEFAULT 0;
```

**Nuevos campos en `user_stats`:**
```sql
ALTER TABLE user_stats
ADD COLUMN total_score INTEGER DEFAULT 0;
```

### Algoritmo de Detección

La función `checkCombination()` en [lib/verification.ts](../lib/verification.ts):

1. **Coincidencia exacta**: Comparación directa de strings
2. **Combinación**: Ordena los dígitos de ambos números y compara
   ```typescript
   const predSorted = pred.split('').sort().join('')
   const actSorted = act.split('').sort().join('')
   if (predSorted === actSorted) { /* es combinación */ }
   ```

### Proceso de Verificación

En [lib/verification.ts](../lib/verification.ts):

1. Obtener resultados oficiales
2. Para cada pronóstico pendiente:
   - Comparar contra resultado oficial
   - Detectar tipo de coincidencia (exact/combination/no_match)
   - Asignar score correspondiente
   - Actualizar campos `match_type`, `match_score`, `is_correct`
3. Recalcular rankings con `updateRankings()`

## Impacto en el Sistema

### Ranking

El ranking ahora ordena por:
1. **Precisión** (accuracy_percentage) - prioridad 1
2. **Total Score** (total_score) - prioridad 2
3. **Aciertos exactos** (correct_predictions) - prioridad 3

```sql
ORDER BY 
  accuracy_percentage DESC, 
  total_score DESC,
  correct_predictions DESC
```

### Estadísticas de Usuario

La tabla `user_stats` ahora incluye:
- `total_score`: Suma de todos los `match_score` de predicciones verificadas
- Se actualiza automáticamente en cada verificación

### UI/UX

**Visualización en predicciones:**
- Badge amarillo "Combinación" para `match_type = 'combination'`
- Texto "+X pts" debajo del badge

**Visualización en ranking:**
- Nueva columna "Score" con tooltip explicativo
- Badge morado mostrando total_score

**Visualización en estadísticas:**
- Nueva tarjeta "Score Combinaciones" con ícono ⚡
- Descripción: "Puntos por combinaciones"

## Ejemplos de Uso

### Ejemplo 1: Lotería 4 cifras
```
Resultado oficial: 1234
Predicción usuario: 4321
Resultado: match_type='combination', match_score=4, is_correct=false
```

### Ejemplo 2: Lotería 3 cifras
```
Resultado oficial: 456
Predicción usuario: 645
Resultado: match_type='combination', match_score=2, is_correct=false
```

### Ejemplo 3: Sin coincidencia
```
Resultado oficial: 1234
Predicción usuario: 5678
Resultado: match_type='no_match', match_score=0, is_correct=false
```

### Ejemplo 4: Acierto exacto
```
Resultado oficial: 1234
Predicción usuario: 1234
Resultado: match_type='exact', match_score=0, is_correct=true
```

## Migración

**Script SQL:** [scripts/021_add_match_score_system.sql](../scripts/021_add_match_score_system.sql)

**Pasos:**
1. Ejecutar migración SQL en base de datos
2. Los campos nuevos se crean con valores por defecto
3. Próxima verificación automática aplicará scores a nuevos pronósticos
4. Pronósticos antiguos mantendrán `match_score=0` hasta re-verificación

## Consideraciones Futuras

- **Ganancias**: Evaluar si combinaciones deben recibir % del premio (ej: 50% del valor normal)
- **5 cifras**: Extender sistema a loterías de 5 cifras
- **Combinaciones parciales**: Evaluar si 3 de 4 dígitos correctos merece puntos (ej: 1 punto)
- **Ponderación en ranking**: Considerar si el score debería tener más peso en el ranking

## Archivos Modificados

- [scripts/021_add_match_score_system.sql](../scripts/021_add_match_score_system.sql)
- [lib/verification.ts](../lib/verification.ts)
- [lib/ranking.ts](../lib/ranking.ts)
- [lib/predictions.ts](../lib/predictions.ts)
- [components/predictions/prediction-list.tsx](../components/predictions/prediction-list.tsx)
- [components/ranking/ranking-table.tsx](../components/ranking/ranking-table.tsx)
- [app/stats/page.tsx](../app/stats/page.tsx)

---

**Fecha de implementación**: Febrero 10, 2026
**Estado**: ✅ Implementado y listo para pruebas
