# 🚀 ML Utilities - Guía de Configuración

## Descripción General

**ML Utilities** es un sistema exclusive para administradores que proporciona herramientas avanzadas de Machine Learning para analizar, evaluar y rankear predicciones de lotería.

## ✨ Características

1. **Análisis de Dataset** - Examinar predicciones históricas
2. **Evaluación del Modelo** - Calcular precisión y métricas de desempeño
3. **Scoring de Predicciones** - Asignar scores de confianza a predicciones
4. **Ranking de Predicciones** - Ordenar por probabilidad de éxito
5. **Histórico de Evaluaciones** - Seguimiento de cambios en el modelo

## 🔒 Control de Acceso

✅ **Solo para rol `"admin"`**:
- Página `/admin/ml-utilities` 
- Todas las server actions en `app/actions/admin/ml-utilities.ts`
- API endpoint `/api/cron/ml-evaluate`

**Protección implementada:**
```typescript
if (!user || user.role !== "admin") {
  return { error: "No autorizado" }
}
```

## 📍 Ubicaciones Principales

| Ubicación | Propósito |
|-----------|-----------|
| [app/admin/ml-utilities/page.tsx](../../../app/admin/ml-utilities/page.tsx) | Página principal UI |
| [app/actions/admin/ml-utilities.ts](../../../app/actions/admin/ml-utilities.ts) | Server actions protegidas |
| [components/admin/ml-*.tsx](../../../components/admin/) | Componentes UI especializados |
| [services/ml_engine/](../../../services/ml_engine/) | Motor ML central |
| [app/api/cron/ml-evaluate/route.ts](../../../app/api/cron/ml-evaluate/route.ts) | Cron job automático |

## 🎮 Cómo Usar

### Acceso desde Admin Panel

1. Ve a `/admin`
2. Haz clic en tab **🧠 ML Utilities**
3. O accede directamente a `/admin/ml-utilities`

### Acciones Disponibles

#### 1. **Evaluar Modelo Ahora**
```
Botón: "Evaluar Modelo Ahora"
Acción: evaluateModelAction()
Resultado: Calcula accuracy del modelo
```

#### 2. **Ver Predicciones Ranqueadas**
```
Sección: "Predicciones Mejor Ranqueadas"
Acción: getRankedPredictionsAction()
Muestra: Top 20 predicciones con scores
```

#### 3. **Historial de Evaluaciones**
```
Sección: "Historial de Evaluaciones"
Acción: getMLEvaluationHistoryAction()
Muestra: Últimas 20 evaluaciones del modelo
```

## ⚙️ Configuración de Cron Jobs (Vercel)

El sistema puede ejecutar evaluaciones automáticas del modelo.

### Configurar en Vercel

1. Ve a **Project Settings** > **Cron Jobs**
2. Haz clic en **Add Cron Job**
3. Configura con los siguientes valores:

```
URL:      https://tudominio.com/api/cron/ml-evaluate
Schedule: 0 1 * * *    (1 AM cada día)
Header:   Authorization: Bearer ${CRON_SECRET}
```

**Explicación de Schedule:**
```
0  1  *  *  *
│  │  │  │  │
│  │  │  │  └─ Día de la semana (0-6, 0=domingo)
│  │  │  └──── Mes (1-12)
│  │  └─────── Día del mes (1-31)
│  └────────── Hora (0-23)
└───────────── Minuto (0-59)

0 1 * * * = 1:00 AM cada día
```

### Variables de Entorno Requeridas

Asegúrate de que estas variables estén en tu `.env.local`:

```env
# Base de datos
DATABASE_URL=postgresql://...

# Cron Jobs
CRON_SECRET=tu-secreto-aleatorio-seguro
```

## 📊 API Server Actions

### `analyzePredictionsAction()`
```typescript
// Analizar dataset completo
const result = await analyzePredictionsAction()

// Retorna:
{
  success: true,
  dataset: DatasetRecord[],
  totalRecords: number,
  analysis: {
    correctCount: 125,
    incorrectCount: 75,
    accuracy: 62.5
  }
}
```

### `evaluateModelAction()`
```typescript
// Evaluar desempeño del modelo
const result = await evaluateModelAction()

// Retorna:
{
  success: true,
  evaluation: {
    totalPredictions: 200,
    correctPredictions: 125,
    accuracy: 62.5,
    evaluationDate: "2026-02-13T...",
    sampleSize: 200
  }
}
```

### `getPredictionsWithScoresAction()`
```typescript
// Obtener predicciones con scores
const result = await getPredictionsWithScoresAction()

// Retorna:
{
  success: true,
  predictions: [
    {
      predictionId: 1,
      lotteryType: "4_digits",
      predictedNumber: "1234",
      score: 75.5,
      confidence: 4,
      recommendation: "Predicción fuerte..."
    }
  ],
  totalCount: 150,
  avgScore: 62.3
}
```

### `getRankedPredictionsAction(limit = 50)`
```typescript
// Obtener top predicciones
const result = await getRankedPredictionsAction(20)

// Retorna predicciones ordenadas por score (descendente)
```

### `getMLEvaluationHistoryAction()`
```typescript
// Ver historial de evaluaciones
const result = await getMLEvaluationHistoryAction()

// Retorna: Últimas 20 evaluaciones con timestamps
```

### `getMLStatsAction()`
```typescript
// Obtener estadísticas del modelo
const result = await getMLStatsAction()

// Retorna:
{
  success: true,
  lastEvaluation: { accuracy_percentage: 62.5, ... },
  predictionStats: [
    { is_verified: true, count: 200, correct: 125 }
  ],
  timestamp: "2026-02-13T..."
}
```

## 🔬 Motor ML (Services)

El sistema usa **MLEngine** desde `@/services/ml_engine/`:

```typescript
// Ejemplo de uso
import { MLEngine } from "@/services/ml_engine"

// Analizar
const dataset = await MLEngine.analyze()

// Evaluar
const evaluation = await MLEngine.evaluate()

// Calcular score
const scoreResult = await MLEngine.scorePrediction({
  predicted_number: "1234",
  created_at: new Date().toISOString(),
  user_accuracy: 60
})
```

## 📈 Interpretación de Scores

| Score | Significado | Confianza |
|-------|-------------|-----------|
| 80+ | Muy Fuerte | ⭐⭐⭐⭐⭐ (5/5) |
| 60-79 | Fuerte | ⭐⭐⭐⭐ (4/5) |
| 40-59 | Moderado | ⭐⭐⭐ (3/5) |
| 20-39 | Débil | ⭐⭐ (2/5) |
| <20 | Muy Débil | ⭐ (1/5) |

## 🔐 Seguridad

✅ **Protecciones implementadas:**
- Verificación de rol `admin` en todas las funciones
- CRON_SECRET para cron jobs
- No hay exposición de BD a cliente
- Todos los datos es server-only

## 🐛 Troubleshooting

### "No autorizado" al acceder a /admin/ml-utilities
- Verifica que tu usuario tenga `role = "admin"` en BD
- Comprueba que estés logueado

### El cron job no se ejecuta
1. Verifica que en `.env.local` tengas `CRON_SECRET`
2. En Vercel, añade la variable `CRON_SECRET` en Settings > Environment Variables
3. Configura el cron job en Settings > Cron Jobs con la URL correcta

### Tabla `ml_evaluations` no existe
- Es opcional. Si no existe, se ignora y solo se guarda en memoria
- Para persistir: ejecuta el SQL migration para crear la tabla

### Scores muy bajos/altos
- Ajusta los pesos del modelo en `services/ml_engine/models/baseline.model.ts`
- Actual pesos: Aporte 50%, Recencia 25%, Volatilidad 15%, Exactitud 35%

## 📝 Próximas Mejoras

- [ ] Dashboard visual más avanzado
- [ ] Exportar reportes a PDF
- [ ] Alertas cuando accuracy cae bajo cierto umbral
- [ ] Ajuste automático de pesos del modelo
- [ ] Comparación de modelos históricos
- [ ] Predicción de tendencias futuras

## 📞 Soporte

Si encuentras issues, contacta al administrador del sistema o revisa los logs en:
- `/api/cron/ml-evaluate` (para cron jobs)
- `console.log("[v0] ...")` en el código

---

**Última actualización:** Febrero 13, 2026
**Por:** GitHub Copilot
