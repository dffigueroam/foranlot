-- Script de verificación del sistema de estrategias
-- Ejecutar después de aplicar la migración 022

-- ============================================
-- 1. Verificar que la tabla existe
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_strategies'
) AS table_exists;

-- ============================================
-- 2. Ver estructura de la tabla
-- ============================================
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_strategies'
ORDER BY ordinal_position;

-- ============================================
-- 3. Verificar constraints
-- ============================================
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_strategies'::regclass;

-- ============================================
-- 4. Verificar índices
-- ============================================
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_strategies';

-- ============================================
-- 5. Verificar que no hay estrategias duplicadas por usuario
-- ============================================
SELECT 
  user_id,
  COUNT(*) as strategy_count
FROM user_strategies
GROUP BY user_id
HAVING COUNT(*) > 1;
-- Debe retornar 0 filas

-- ============================================
-- 6. Ver loterias disponibles para estrategias
-- ============================================
SELECT DISTINCT lottery_name
FROM lottery_results
ORDER BY lottery_name;

-- ============================================
-- 7. Verificar que hay suficientes resultados (>=15) por lotería
-- ============================================
SELECT 
  lottery_name,
  COUNT(*) as total_results
FROM lottery_results
GROUP BY lottery_name
HAVING COUNT(*) >= 15
ORDER BY total_results DESC;

-- ============================================
-- 8. Test: Insertar estrategia de prueba (comentado por seguridad)
-- ============================================
/*
-- Reemplazar <USER_ID> con un ID de usuario premium real
INSERT INTO user_strategies (user_id, lottery_name, digits_type, parameters)
VALUES (
  <USER_ID>,
  'Medellín',
  4,
  '{"test": true}'::jsonb
)
ON CONFLICT (user_id) 
DO UPDATE SET
  lottery_name = EXCLUDED.lottery_name,
  digits_type = EXCLUDED.digits_type,
  parameters = EXCLUDED.parameters,
  updated_at = NOW();

-- Ver la estrategia insertada
SELECT * FROM user_strategies WHERE user_id = <USER_ID>;

-- Limpiar test (opcional)
-- DELETE FROM user_strategies WHERE user_id = <USER_ID> AND parameters->>'test' = 'true';
*/

-- ============================================
-- 9. Estadísticas útiles
-- ============================================

-- Total de usuarios premium
SELECT COUNT(*) as total_premium_users
FROM users
WHERE is_premium = true;

-- Total de estrategias creadas
SELECT COUNT(*) as total_strategies
FROM user_strategies;

-- Distribución de estrategias por lotería
SELECT 
  lottery_name,
  COUNT(*) as strategy_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_strategies), 2) as percentage
FROM user_strategies
GROUP BY lottery_name
ORDER BY strategy_count DESC;

-- Distribución por tipo de dígitos
SELECT 
  digits_type,
  COUNT(*) as strategy_count
FROM user_strategies
GROUP BY digits_type
ORDER BY digits_type;

-- ============================================
-- Fin del script de verificación
-- ============================================
