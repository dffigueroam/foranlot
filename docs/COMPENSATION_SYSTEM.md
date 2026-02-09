# Sistema de Compensación con Scoring Multi-criterio

## Descripción General

El sistema de compensación de ForanLot distribuye premios entre usuarios basándose en **tres criterios ponderados**:

### Criterios de Scoring (Total: 100%)

| Criterio | Peso | Descripción |
|----------|------|-------------|
| **Aporte Económico** | 50% | Proporción del capital total aportado por el usuario |
| **Recurrencia** | 30% | Frecuencia con la que el usuario predice números ganadores |
| **Consistencia** | 20% | Precisión histórica del usuario (accuracy) |

### Distribución de Premio

Cuando un número gana:
- **Premio Bruto** = Capital Total × Multiplicador (400× para 3 cifras, etc.)
- **Fondo Usuarios** = 25% del premio bruto
- **Plataforma** = 75% del premio bruto

El **fondo de usuarios (25%)** se distribuye proporcionalmente según el score total de cada usuario.

## Arquitectura Técnica

### 1. Cálculo de Scores (`lib/compensation.ts`)

```typescript
// Score de aporte (50%)
contributionScore = amountUser / totalCapital

// Score de recurrencia (30%)
recurrenceScore = predictionsUser / totalPredictions

// Score de consistencia (20%)
consistencyScore = correctPredictions / totalPredictions

// Score total ponderado
totalScore = (contribution × 0.50) + (recurrence × 0.30) + (consistency × 0.20)
```

### 2. Tablas de Base de Datos

#### `user_ranking_scores`
Almacena scores históricos para auditoría:
- `user_id` - ID del usuario
- `score_date` - Fecha del cálculo
- `contribution_score` - Score de aporte (0-1)
- `recurrence_score` - Score de recurrencia (0-1)
- `consistency_score` - Score de consistencia (0-1)
- `total_score` - Score total ponderado (0-1)

#### `compensation_log`
Registro de pagos ejecutados:
- `user_id` - Usuario compensado
- `amount_cents` - Monto en centavos
- `reason` - Descripción del pago
- `created_at` - Timestamp de ejecución

### 3. Panel de Administración

**Ruta**: `/admin` → Tab "Compensación"

Funciones:
- **Simular Compensación**: Calcula distribución sin ejecutar pagos
- **Ejecutar Compensación**: Registra pagos reales en `compensation_log`
- **Visualizar Distribución**: Muestra scores de cada usuario y monto asignado

### 4. Componentes Clave

| Archivo | Propósito |
|---------|-----------|
| `lib/compensation.ts` | Lógica de cálculo de scores y distribución |
| `app/actions/admin/compensation.ts` | Server actions para admin panel |
| `components/admin/compensation-panel.tsx` | UI para simulación y ejecución |
| `lib/ranking.ts` | Funciones de consulta de scores históricos |

## Flujo de Uso

### 1. Simulación (Sin afectar DB)

```
Admin → Panel Compensación → Ingresar datos:
  - Capital Total: $100
  - Multiplicador: 400×
  - Número Ganador: 123
  - Lotería: Baloto
  - Fecha: 2026-02-05

→ Presionar "Simular"
→ Ver resultados:
  - Premio Bruto: $40,000
  - Fondo Usuarios: $10,000 (25%)
  - Plataforma: $30,000 (75%)
  - Distribución por usuario con scores
```

### 2. Ejecución (Registra en DB)

```
Admin → Revisar simulación → Presionar "Ejecutar Compensación"
→ Confirmar acción
→ Sistema:
  1. Inserta registros en compensation_log
  2. Guarda scores en user_ranking_scores
  3. Revalida caches (/admin, /ranking)
```

### 3. Visualización de Scores

**Ranking con Scores Detallados**:
- Los usuarios pueden ver sus scores en `/ranking`
- Muestra badges de colores para cada criterio:
  - 🎯 Aporte (azul)
  - ⚡ Recurrencia (morado)
  - 📈 Consistencia (verde)
  - 🏆 Score Total (gradiente púrpura-rosa)

## Ejemplo Real

### Escenario
- **Capital Total**: $100
- **Multiplicador**: 400×
- **Premio Bruto**: $40,000
- **Fondo Usuarios**: $10,000
- **Número Ganador**: 123 (Baloto)

### Usuarios con Predicciones Correctas

| Usuario | Aporte | Contribución (50%) | Recurrencia (30%) | Consistencia (20%) | Score Total | Pago |
|---------|--------|-------------------|-------------------|-------------------|-------------|------|
| Usuario A | $50 | 0.50 | 0.40 | 0.80 | 0.526 | $5,260 |
| Usuario B | $30 | 0.30 | 0.35 | 0.65 | 0.340 | $3,400 |
| Usuario C | $20 | 0.20 | 0.25 | 0.50 | 0.240 | $2,400 |

**Validación**: $5,260 + $3,400 + $2,400 = $11,060 ❌

*Nota*: Los scores se normalizan para que sumen exactamente 1.0, garantizando que el fondo se distribuya completamente.

## API Reference

### `simulateCompensation(scenario: CompensationScenario)`
Calcula distribución sin ejecutar pagos.

**Parámetros**:
```typescript
interface CompensationScenario {
  totalCapital: number       // En centavos
  multiplier: number
  winningNumber: string
  lotteryType: string
  drawDate: string
  userContributions: Array<{
    userId: number
    amount: number           // En centavos
  }>
}
```

**Retorna**:
```typescript
{
  scenario: {
    totalCapital: number
    multiplier: number
    grossPrize: number
    userFund: number         // 25% del bruto
    platformShare: number    // 75% del bruto
  }
  distribution: Array<{
    userId: number
    username: string
    score: number            // 0-1
    compensation: number     // En centavos
  }>
}
```

### `calculateUserScores(scenario: CompensationScenario)`
Calcula scores individuales de cada usuario.

### `saveRankingScores(userScores: UserScore[], date: string)`
Guarda scores en `user_ranking_scores` para auditoría.

## Consideraciones de Producción

### Seguridad
- ✅ Solo admins pueden ejecutar compensaciones
- ✅ Requiere confirmación antes de ejecutar
- ✅ Todos los pagos se registran con timestamp

### Auditoría
- ✅ Histórico completo en `compensation_log`
- ✅ Scores históricos en `user_ranking_scores`
- ✅ Trazabilidad por fecha y usuario

### Escalabilidad
- ⚠️ Cálculos se hacen en memoria (OK para <1000 usuarios)
- ⚠️ Para >1000 usuarios, considerar batch processing
- ✅ Queries optimizadas con índices en user_id

### Testing
Comandos de prueba:
```bash
# Simular escenario de prueba
curl -X POST http://localhost:3000/api/admin/simulate-compensation \
  -H "Content-Type: application/json" \
  -d '{
    "totalCapital": 10000,
    "multiplier": 400,
    "winningNumber": "123",
    "lotteryType": "Baloto",
    "drawDate": "2026-02-05"
  }'
```

## Próximas Mejoras

1. **Histórico de Compensaciones**: Dashboard con gráficos de pagos
2. **Notificaciones**: Alertar usuarios cuando reciben compensación
3. **Exportar Reportes**: CSV/PDF de distribuciones
4. **Compensación Automática**: Trigger al verificar resultados diarios
5. **Multi-moneda**: Soporte para USD/EUR además de COP

---

**Última Actualización**: Febrero 2026  
**Versión**: 1.0  
**Autor**: ForanLot Engineering Team
