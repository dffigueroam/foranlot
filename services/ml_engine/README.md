# ML Engine - Sistema de Análisis de Predicciones

## Descripción
Sistema de machine learning para análisis, scoring y evaluación de predicciones de lotería. Combina múltiples modelos para proporcionar recomendaciones y métricas de confianza.

## Estructura

```
services/ml_engine/
├── index.ts                 # Punto de entrada principal (MLEngine API)
├── config.ts               # Configuración centralizada
├── data/
│   ├── dataset.builder.ts   # Construcción de datasets desde BD
│   └── feature.engineering.ts # Extracción de características
├── models/
│   ├── baseline.model.ts    # Modelo base de probabilidad
│   └── scoring.model.ts     # Modelo principal de scoring
├── evaluation/
│   └── evaluator.ts         # Evaluación de desempeño
├── integration/
│   └── prediction.adapter.ts # Adaptador para predicciones
└── README.md                # Este archivo
```

## Uso

### Importes Correctos (con @/ alias)

```typescript
// ✅ CORRECTO - Usar @/ alias
import { MLEngine } from "@/services/ml_engine"
import { MLConfig } from "@/services/ml_engine/config"
import { buildDataset } from "@/services/ml_engine/data/dataset.builder"
import { calculateScore } from "@/services/ml_engine/models/scoring.model"
import { evaluateModel } from "@/services/ml_engine/evaluation/evaluator"

// ❌ INCORRECTO - Rutas relativas
import { MLEngine } from "./index"
import { calculateScore } from "../models/scoring.model"
```

## API Principal

### MLEngine

```typescript
// Analizar dataset completo
const dataset = await MLEngine.analyze()

// Calcular score de predicción
const result = await MLEngine.scorePrediction({
  predicted_number: "123",
  created_at: new Date().toISOString(),
  user_accuracy: 60
})
// Retorna: { calculatedScore, suggestedConfidence, confidenceLevel, recommendation }

// Evaluar desempeño del modelo
const evaluation = await MLEngine.evaluate()
// Retorna: { totalPredictions, correctPredictions, accuracy, evaluationDate }
```

## Configuración

### MLConfig - Parámetros del Modelo

```typescript
export const MLConfig = {
  minSamplesRequired: 50,      // Mínimo para entrenar
  hotWindow: 20,               // Ventana de números calientes
  coldWindow: 50,              // Ventana de números fríos
  retrainThreshold: 100,       // Umbral para reentrenamiento
}
```

## Features Extraídas

- **numberFrequency**: Proporción de dígitos únicos
- **digitPattern**: Patrón de cantidad de dígitos (D3, D4, etc.)
- **recencyScore**: Score basado en antigüedad (0-100)
- **volatility**: Variación entre dígitos (0-9)
- **historicalAccuracy**: Exactitud histórica del usuario (0-100)

## Modelos

### Baseline Model
Modelo probabilístico que usa:
- Frecuencia de números: 25%
- Recencia: 25%
- Volatilidad: 15%
- Exactitud histórica: 35%

### Scoring Model
Combina features y genera:
- **calculatedScore**: Score (0-100)
- **suggestedConfidence**: Nivel de confianza (1-5)
- **confidenceLevel**: Clasificación (very_low, low, medium, high, very_high)
- **recommendation**: Recomendación textual

## Evaluación

El evaluador del modelo:
- Calcula accuracy sobre dataset histórico
- Compara evaluaciones en el tiempo
- Detecta mejoras o degradación

### Ejemplo de Evaluación

```typescript
const evaluation = await MLEngine.evaluate()
// {
//   totalPredictions: 1250,
//   correctPredictions: 625,
//   accuracy: 50.0,
//   evaluationDate: "2026-02-13T...",
//   sampleSize: 1250
// }
```

## Server-Only Functions

Todos los archivos incluyen `"use server"` al inicio, indicando que:
- Solo se ejecutan en servidor
- Tienen acceso a la BD
- No exponen secretos al cliente
- Seguras para cron jobs

## Integración con Predicciones

El `prediction.adapter.ts` proporciona:
- `getPredictionsWithScores()`: Obtener predicciones con scores
- `filterPredictionsByConfidence(minConfidence)`: Filtrar por confianza
- `getRankedPredictions(limit)`: Ranking ordenado por score

## Notas de Desarrollo

- Los archivos `.txt` originales han sido reemplazados por `.ts` reales
- Todos usan `@/` alias para imports (tsconfig.json)
- Algunos archivos aún son plantillas - completar según necesidad
- El modelo es educativo; ajustar pesos según datos reales

## Próximas Mejoras

- [ ] Integración con API externa de análisis
- [ ] Reentrenamiento automático de modelos
- [ ] Caché de evaluaciones
- [ ] Métricas por tipo de lotería
- [ ] Análisis de tendencias temporales
