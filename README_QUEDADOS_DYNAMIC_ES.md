# Implementación dinámica del formulario de Quedados

## Endpoints

- `/api/tools/countries`: Devuelve países únicos activos
- `/api/tools/digits?country=...`: Devuelve cifras únicas para un país
- `/api/tools/lotteries-list?country=...&digitCount=...`: Devuelve loterías filtradas por país y cifras

## Componente React
- Usa `useEffect` encadenado para carga dinámica
- Maneja estados de loading y error en cada select
- Sin valores hardcodeados
- Escalable para múltiples países

## Recomendaciones de índices PostgreSQL
- `CREATE INDEX idx_lotteries_country ON lotteries(country);`
- `CREATE INDEX idx_lotteries_digits ON lotteries USING GIN(digits);`
- `CREATE INDEX idx_lotteries_is_active ON lotteries(is_active);`
- `CREATE INDEX idx_lotteries_country_digits_active ON lotteries(country, is_active);`

## Listo para producción
- Manejo robusto de errores
- Sin recargas innecesarias
- Código limpio y escalable
