# Quedados Tool Dynamic Form Implementation

## Endpoints

- `/api/tools/countries`: Returns unique active countries
- `/api/tools/digits?country=...`: Returns unique digit counts for a country
- `/api/tools/lotteries-list?country=...&digitCount=...`: Returns lotteries filtered by country and digit count

## React Component
- Uses chained `useEffect` for dynamic loading
- Handles loading and error states for each select
- No hardcoded values
- Scalable for multiple countries

## PostgreSQL Index Recommendations
- `CREATE INDEX idx_lotteries_country ON lotteries(country);`
- `CREATE INDEX idx_lotteries_digits ON lotteries USING GIN(digits);`
- `CREATE INDEX idx_lotteries_is_active ON lotteries(is_active);`
- `CREATE INDEX idx_lotteries_country_digits_active ON lotteries(country, is_active);`

## Production Ready
- Robust error handling
- No unnecessary reloads
- Clean, scalable code
