-- Ejemplos de estrategias para testing
-- Ejecutar DESPUÉS de tener un usuario premium

-- ============================================
-- EJEMPLO 1: Estrategia Simple de Tendencia
-- ============================================
-- Usuario: ID 1 (reemplazar con tu user_id real)
-- Concepto: Sumar 1 al primer dígito del último sorteo

INSERT INTO user_strategies (user_id, lottery_name, digits_type, parameters)
VALUES (
  1,  -- CAMBIAR por tu user_id
  'Medellín',
  4,
  '{
    "rules": [
      {
        "id": "rule_1",
        "type": "sum",
        "sourcePosition": 0,
        "targetPosition": 0,
        "operation": "add",
        "value": 1,
        "lookbackDays": 1
      }
    ],
    "combineLogic": "sequential",
    "limitPerRule": 10
  }'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET
  lottery_name = EXCLUDED.lottery_name,
  digits_type = EXCLUDED.digits_type,
  parameters = EXCLUDED.parameters,
  updated_at = NOW();

-- Verificar
SELECT 
  id, 
  user_id, 
  lottery_name, 
  digits_type, 
  parameters 
FROM user_strategies 
WHERE user_id = 1;  -- CAMBIAR por tu user_id

-- ============================================
-- EJEMPLO 2: Estrategia de Posiciones Cruzadas
-- ============================================
-- Concepto: Intercambiar primera y última posición

INSERT INTO user_strategies (user_id, lottery_name, digits_type, parameters)
VALUES (
  1,  -- CAMBIAR por tu user_id
  'Medellín',
  4,
  '{
    "rules": [
      {
        "id": "rule_1",
        "type": "position",
        "sourcePosition": 0,
        "targetPosition": 3,
        "lookbackDays": 1
      },
      {
        "id": "rule_2",
        "type": "position",
        "sourcePosition": 3,
        "targetPosition": 0,
        "lookbackDays": 1
      }
    ],
    "combineLogic": "combinations",
    "limitPerRule": 10
  }'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET
  lottery_name = EXCLUDED.lottery_name,
  digits_type = EXCLUDED.digits_type,
  parameters = EXCLUDED.parameters,
  updated_at = NOW();

-- ============================================
-- EJEMPLO 3: Estrategia Temporal Múltiple
-- ============================================
-- Concepto: Analizar 3 momentos del tiempo (reciente, medio, antiguo)

INSERT INTO user_strategies (user_id, lottery_name, digits_type, parameters)
VALUES (
  1,  -- CAMBIAR por tu user_id
  'Medellín',
  4,
  '{
    "rules": [
      {
        "id": "rule_1",
        "type": "position",
        "sourcePosition": 0,
        "targetPosition": 0,
        "lookbackDays": 1
      },
      {
        "id": "rule_2",
        "type": "position",
        "sourcePosition": 1,
        "targetPosition": 1,
        "lookbackDays": 5
      },
      {
        "id": "rule_3",
        "type": "position",
        "sourcePosition": 2,
        "targetPosition": 2,
        "lookbackDays": 10
      }
    ],
    "combineLogic": "combinations",
    "limitPerRule": 10
  }'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET
  lottery_name = EXCLUDED.lottery_name,
  digits_type = EXCLUDED.digits_type,
  parameters = EXCLUDED.parameters,
  updated_at = NOW();

-- ============================================
-- EJEMPLO 4: Estrategia de Espejo + Suma
-- ============================================
-- Concepto: Invertir el resultado y luego sumar valores

INSERT INTO user_strategies (user_id, lottery_name, digits_type, parameters)
VALUES (
  1,  -- CAMBIAR por tu user_id
  'Medellín',
  4,
  '{
    "rules": [
      {
        "id": "rule_1",
        "type": "mirror",
        "lookbackDays": 1
      },
      {
        "id": "rule_2",
        "type": "sum",
        "sourcePosition": 0,
        "targetPosition": 0,
        "value": 5,
        "lookbackDays": 1
      },
      {
        "id": "rule_3",
        "type": "subtract",
        "sourcePosition": 3,
        "targetPosition": 3,
        "value": 2,
        "lookbackDays": 1
      }
    ],
    "combineLogic": "sequential",
    "limitPerRule": 3
  }'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET
  lottery_name = EXCLUDED.lottery_name,
  digits_type = EXCLUDED.digits_type,
  parameters = EXCLUDED.parameters,
  updated_at = NOW();

-- ============================================
-- EJEMPLO 5: Estrategia de Último Dígito
-- ============================================
-- Concepto: Usar último dígito como base

INSERT INTO user_strategies (user_id, lottery_name, digits_type, parameters)
VALUES (
  1,  -- CAMBIAR por tu user_id
  'Bogota',
  3,
  '{
    "rules": [
      {
        "id": "rule_1",
        "type": "last_digit",
        "lookbackDays": 1
      }
    ],
    "combineLogic": "sequential",
    "limitPerRule": 10
  }'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET
  lottery_name = EXCLUDED.lottery_name,
  digits_type = EXCLUDED.digits_type,
  parameters = EXCLUDED.parameters,
  updated_at = NOW();

-- ============================================
-- VERIFICAR TODAS LAS ESTRATEGIAS
-- ============================================
SELECT 
  id,
  user_id,
  lottery_name,
  digits_type,
  jsonb_pretty(parameters) as strategy_details,
  created_at,
  updated_at
FROM user_strategies
WHERE user_id = 1;  -- CAMBIAR por tu user_id

-- ============================================
-- SIMULAR CONESCRIPT (Ejemplo TypeScript)
-- ============================================
/*
// En Node.js o en el navegador después de login:

const testStrategy = async () => {
  const response = await fetch('/api/strategies/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  
  const data = await response.json()
  console.log('Resultados:', data)
  console.log('Aciertos:', data.hits)
  console.log('Combinaciones:', data.combinations)
}

testStrategy()
*/

-- ============================================
-- ANÁLISIS DE RENDIMIENTO
-- ============================================
-- Ver cómo se distribuyen las estrategias por tipo

WITH strategy_types AS (
  SELECT 
    user_id,
    lottery_name,
    digits_type,
    jsonb_array_elements(parameters->'rules') as rule
  FROM user_strategies
)
SELECT 
  rule->>'type' as rule_type,
  COUNT(*) as count,
  ARRAY_AGG(DISTINCT lottery_name) as lotteries_used
FROM strategy_types
GROUP BY rule->>'type'
ORDER BY count DESC;

-- ============================================
-- LIMPIAR ESTRATEGIAS DE PRUEBA
-- ============================================
-- Descomenta para limpiar
-- DELETE FROM user_strategies WHERE user_id = 1;  -- CAMBIAR por tu user_id
