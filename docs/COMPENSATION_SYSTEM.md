# Sistema de Compensación por Acierto con Filtro de P&G

## Descripción General

El sistema de compensación por acierto de ForanLot ahora sigue una regla simple:

- Solo se remunera a los pronosticadores con **P&G positivo**.
- El **ranking no define** quién cobra ni cuánto cobra en este flujo.
- Entre los elegibles, el fondo de usuarios se reparte de forma uniforme.

### Regla actual de P&G

Mientras no exista una tabla financiera de apuestas con `net_profit`, el sistema usa este proxy operativo:

```typescript
P&G = aciertos verificados - fallos verificados
```

Si el resultado es mayor que `0`, el pronosticador queda habilitado para remuneración.

### Distribución de Premio

Cuando un número gana:
- **Premio Bruto** = Capital Total × Multiplicador (400× para 3 cifras, etc.)
- **Fondo Usuarios** = 25% del premio bruto
- **Plataforma** = 75% del premio bruto

El **fondo de usuarios (25%)** se distribuye únicamente entre los elegibles con P&G positivo.

## Arquitectura Técnica

### 1. Elegibilidad y distribución (`lib/compensation.ts`)

```typescript
profitAndLoss = correctPredictions - incorrectPredictions

isEligible = profitAndLoss > 0

compensationPerUser = userFund / eligibleUsers.length
```

### 2. Tablas de Base de Datos

#### `user_ranking_scores`
Almacena scores históricos de ranking para auditoría independiente:
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
- **Simular Compensación**: Calcula distribución solo para usuarios con P&G positivo
- **Ejecutar Compensación**: Registra pagos reales en `compensation_log`
- **Visualizar Distribución**: Muestra usuarios elegibles y monto asignado

### 4. Componentes Clave

| Archivo | Propósito |
|---------|-----------|
| `lib/compensation.ts` | Lógica de elegibilidad por P&G y distribución |
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
  - Distribución por usuario elegible
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

### 3. Ranking y auditoría

El ranking sigue existiendo como vista analítica y auditoría, pero ya no es condición de pago dentro de la compensación por acierto.

## Ejemplo Real

### Escenario
- **Capital Total**: $100
- **Multiplicador**: 400×
- **Premio Bruto**: $40,000
- **Fondo Usuarios**: $10,000
- **Número Ganador**: 123 (Baloto)

### Usuarios con Predicciones Correctas

| Usuario | Aciertos | Fallos | P&G | Elegible | Pago |
|---------|----------|--------|-----|----------|------|
| Usuario A | 12 | 8 | 4 | Sí | $3,333.34 |
| Usuario B | 7 | 10 | -3 | No | $0 |
| Usuario C | 9 | 6 | 3 | Sí | $3,333.33 |
| Usuario D | 5 | 4 | 1 | Sí | $3,333.33 |

*Nota*: Si no hay usuarios con P&G positivo, no se ejecuta remuneración.

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

### `getEligiblePredictorsByPositivePnG(userIds: number[])`
Obtiene los pronosticadores con P&G positivo.

### `saveRankingScores(userScores: UserScore[], date: string)`
Guarda scores en `user_ranking_scores` para auditoría del ranking.

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
