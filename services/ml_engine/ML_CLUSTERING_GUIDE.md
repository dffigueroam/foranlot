# 🧬 ML Clustering - Generador de Usuarios Sintéticos Inteligente

## Descripción General

**ML Clustering** es un sistema avanzado que utiliza machine learning para analizar usuarios reales con buen historial y automáticamente crear usuarios sintéticos que combinan características de múltiples usuarios destacados.

En lugar de crear sintéticos manualmente, el sistema:
1. **Identifica** usuarios con historial sólido (mínimo 20 predicciones, 40% accuracy)
2. **Agrupa** usuarios similares por especialización (día de semana o tipo de lotería)
3. **Analiza** sus características ML (scores, features, accuracy)
4. **Genera** usuarios sintéticos que combinan las mejores características del grupo

## 🎯 Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────┐
│ 1. IDENTIFICAR USUARIOS BUENOS                          │
│    - Filtrar: min 20 predicciones, 40% accuracy        │
│    - Enriquecer con features ML                         │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 2. AGRUPAR POR ESPECIALIZACIÓN                          │
│    - Día de Semana: Mejores usuarios por día            │
│    - Tipo de Lotería: Mejores usuarios por lotería      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 3. CALCULAR CLUSTERS                                    │
│    - Promediar features: frequency, recency, etc        │
│    - Calcular pesos: basados en accuracy                │
│    - Centroide: características promedio del cluster    │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 4. GENERAR USUARIOS SINTÉTICOS                          │
│    - Crear usuario pendiente por cada cluster           │
│    - Definir composición: usuarios + pesos              │
│    - Estado: "pending_approval"                         │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 5. APROBACIÓN DEL ADMIN                                 │
│    - Revisar composición de cada sintético              │
│    - Aprobar o rechazar                                 │
│    - Activar en el ranking                              │
└─────────────────────────────────────────────────────────┘
```

## 📊 Criterios de Identificación

### Usuarios "Buenos"

```sql
WHERE:
  - total_predictions >= 20        -- Mínimo 20 predicciones
  - accuracy_percentage >= 40       -- Al menos 40% de aciertos
  - is_synthetic = false            -- Usuarios reales, no IA
```

### Features Analizados

Para cada usuario se extraen:
- **Frequency Score**: Proporción de dígitos únicos
- **Recency Score**: Qué tan reciente es su actividad (0-100)
- **Volatility**: Variación entre dígitos (0-9)
- **Historical Accuracy**: Exactitud histórica del usuario

## 🏗️ Estructura de Clusters

### Cluster por Día

```
Sintetic_daybest_Lunes
├── Usuario A (80% accuracy) → peso 0.35
├── Usuario B (75% accuracy) → peso 0.33
└── Usuario C (70% accuracy) → peso 0.32

Centroid: 75% accuracy, combinadas features de los 3
```

### Cluster por Lotería

```
Sintetic_lotbest_4_digits
├── Usuario X (85% accuracy) → peso 0.40
├── Usuario Y (82% accuracy) → peso 0.38
└── Usuario Z (78% accuracy) → peso 0.22

Centroid: 81.7% accuracy promedio
```

## 🔢 Cálculo de Pesos

Los pesos se asignan **proporcionalmente a la accuracy**:

```typescript
weight = user_accuracy / sum_of_all_accuracies

Ejemplo con 3 usuarios:
Usuario A: 80% → 80 / (80+75+70) = 0.35
Usuario B: 75% → 75 / 225 = 0.33
Usuario C: 70% → 70 / 225 = 0.31
```

## 📁 Ubicaciones Principales

| Archivo | Propósito |
|---------|-----------|
| [lib/ml-user-clustering.ts](../../../lib/ml-user-clustering.ts) | Lógica central de clustering |
| [app/actions/admin/ml-clustering.ts](../../../app/actions/admin/ml-clustering.ts) | Server actions protegidas |
| [components/admin/ml-clustering-synthetics.tsx](../../../components/admin/ml-clustering-synthetics.tsx) | Interfaz UI |
| [app/admin](../../../app/admin/page.tsx) | Integración en admin panel |

## 🎮 Cómo Usar

### Paso 1: Analizar Usuarios

1. Ve a **Admin** > Tab **🧬 ML Clustering**
2. Haz clic en **"1. Analizar Usuarios"**
3. El sistema:
   - Identifica usuarios buenos
   - Los agrupa por especialización
   - Calcula estadísticas de clusters

### Paso 2: Revisar Clusters

Dans la interfaz verás:
- **Estadísticas**: Total de clusters, usuarios involucrados, accuracy promedio
- **Detalles por Cluster**: Lista expandible de usuarios en cada grupo
- **Composición**: Cuáles serían los usuarios sintéticos

### Paso 3: Generar Sintéticos

1. Haz clic en **"2. Generar Sintéticos"**
2. El sistema crea usuarios pendientes con su composición
3. Aparecerán en "Usuarios Sintéticos" > "Pendientes de Aprobación"

### Paso 4: Aprobar en Admin

1. Ve a **Admin** > Tab **Usuarios AI**
2. Revisa "Pendientes de Aprobación"
3. Aprueba o rechaza cada usuario sintético

## 📈 Estadísticas Mostradas

### En la Tarjeta de Análisis

```
Clusters Formados: 12
├── 7 por día (Day Best)
└── 5 por lotería (Lot Best)

Usuarios Involucrados: 45
└── Promedio 3.75 usuarios por cluster

Accuracy Promedio: 67.3%
└── De los centroides de todos los clusters

Usuarios "Buenos": 45
└── Mínimo 20 predicciones, 40% accuracy
```

### En Tabla de Sintéticos

| Nombre | Tipo | Especialización | Usuarios | Accuracy |
|--------|------|-----------------|----------|----------|
| Sintetic_daybest_Lunes | Day | Lunes | 3 | 75.2% |
| Sintetic_lotbest_4_digits | Lot | 4_digits | 4 | 81.5% |

## 🔒 Seguridad

✅ **Protected con rol admin**: Solo administradores pueden usar esta función
✅ **Server-side only**: Todo el análisis ocurre en servidor
✅ **Non-destructive**: Solo crea usuarios pendientes, no modifica existentes
✅ **Approval workflow**: Requiere aprobación antes de activación

## 🛠️ API de Server Actions

### `analyzeUsersForSyntheticsAction()`

Analiza usuarios sin crear sintéticos

```typescript
const result = await analyzeUsersForSyntheticsAction()

// Retorna:
{
  success: true,
  goodUsers: UserMLProfile[],     // Usuarios identificados
  clusters: UserCluster[],         // Clusters formados
  syntheticsData: Object[],        // Datos de sintéticos a crear
  stats: {
    totalClusters: 12,
    totalUsersInvolved: 45,
    dayBestClusters: 7,
    lotBestClusters: 5,
    avgClusterSize: 3.75,
    totalCentroidAccuracy: 67.3
  }
}
```

### `generateSyntheticsFromClustersAction()`

Genera usuarios sintéticos desde clusters

```typescript
const result = await generateSyntheticsFromClustersAction()

// Retorna:
{
  success: true,
  createdSynthetics: [
    {
      name: "Sintetic_daybest_Lunes",
      type: "daybest",
      specialization: "Lunes",
      updateId: 123,
      usersCount: 3,
      status: "pending_approval"
    }
  ],
  message: "5 usuarios sintéticos creados (pendientes de aprobación)",
  totalUsers: 45
}
```

### `getClusterAnalysisAction()`

Obtiene análisis sin crear sintéticos

```typescript
const result = await getClusterAnalysisAction()
// Mismo formato que analyzeUsersForSyntheticsAction()
```

## 🎯 Casos de Uso

### Caso 1: Llenar Huecos en Ranking

Si no hay suficientes usuarios en cierta lotería:
1. Ejecutar análisis
2. Encontrará usuarios que tienen buen desempeño en esa lotería
3. Crear sintético que los combina
4. Llenar el hueco en el ranking

### Caso 2: Mejorar Ranking de Fin de Semana

Si observas que el ranking es pobre los sábados:
1. Ejecutar análisis
2. Sistema identifica mejores usuarios los sábados
3. Crear "Sintetic_daybest_Sabado"
4. Ofrece mejor experiencia a usuarios

### Caso 3: Competencia por Especialidad

Para crear usuarios que "compitan" en cierta lotería:
1. Agrupar mejores en 4_digits
2. Agrupar mejores en 3_digits
3. Crear sintéticos que "specialized" en cada una
4. Motivar a usuarios a seguir especialidades

## 📊 Interpretación de Resultados

### Datos Esperados

- **Clusters Formados**: 10-15 es lo normal
- **Usuarios por Cluster**: 2-5 usuarios es óptimo
- **Accuracy Promedio**: 50-70% es típico
- **Usuarios "Buenos"**: Depende del volumen, pero 30+ es buena señal

### Señales de Advertencia

⚠️ **Pocos usuarios buenos**: < 20 usuarios
- Posible: Comunidad muy nueva, estándares muy altos
- Acción: Reducir umbrales (actualmente 20 pred, 40% accuracy)

⚠️ **Muy pocos clusters**: < 5 clusters
- Posible: Datos insuficientes
- Acción: Esperar más predicciones verificadas

⚠️ **Clusters con solo 1 usuario**: Se ignoran automáticamente
- Necesita al menos 2 usuarios para formar cluster
- Acción: Agregar más datos

## 🔧 Personalización

### Ajustar Umbrales de "Usuario Bueno"

En [lib/ml-user-clustering.ts](../../../lib/ml-user-clustering.ts) línea 27:

```typescript
WHERE us.total_predictions >= 20          // ← CAMBIAR AQUÍ
  AND us.accuracy_percentage >= 40        // ← O AQUÍ
```

Ejemplos:
```typescript
// Más estricto: >= 30 pred, >= 50% accuracy
// Más flexible: >= 10 pred, >= 30% accuracy
```

### Agregar Nuevo Tipo de Clustering

Expandir `clusterUsersBySpecialization()` para agrupar por:
- País usuario
- Rango de edad
- Patrones temporales
- Etc.

## 📝 Próximas Mejoras

- [ ] K-means avanzado para clustering más sofisticado
- [ ] Detección de outliers (usuarios anómalos)
- [ ] Machine learning para predecir mejor performance del sintético
- [ ] Visualización gráfica de clusters (dendrograma)
- [ ] Auto-actualización periódica de clusters
- [ ] Métricas de estabilidad de clusters

## 🐛 Troubleshooting

### "No hay usuarios con suficiente historial"

**Causa**: Menos de 20 usuarios con 20+ predicciones y 40%+ accuracy

**Soluciones**:
```typescript
// Opción 1: Ejecutar más días para acumular datos
// Opción 2: Reducir umbrales temporalmente
// Opción 3: Usar panel "Usuarios Sintéticos" manual
```

### "Clusters solo tienen 1 usuario"

**Esperado**: Se ignoran automáticamente (necesita >= 2)

**Acción**: Esperar más usuarios en esa especialidad

### Sintéticos creados pero aparecen en "Pendientes"

**Esperado**: Así es el flujo. Requieren aprobación del admin.

**Acción**: Ve a "Usuarios AI" y aprueba.

---

**Última actualización:** Febrero 13, 2026
**Por:** GitHub Copilot
