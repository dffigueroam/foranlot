-- Test rápido del sistema de estrategias
-- Ejecutar en Neon SQL Editor para verificar integridad

-- ============================================
-- 1. Verificar tabla user_strategies
-- ============================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'user_strategies') as column_count
FROM information_schema.tables 
WHERE table_name = 'user_strategies';
-- Debe retornar 1 fila con column_count = 7

-- ============================================
-- 2. Verificar constraint UNIQUE en user_id
-- ============================================
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'user_strategies'::regclass
  AND contype = 'u';  -- UNIQUE constraint
-- Debe mostrar constraint con user_id

-- ============================================
-- 3. Verificar que digits_type tiene CHECK constraint
-- ============================================
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'user_strategies'::regclass
  AND contype = 'c';  -- CHECK constraint
-- Debe mostrar CHECK (digits_type IN (3, 4, 5))

-- ============================================
-- 4. Contar loterias con suficientes datos (>=15 resultados)
-- ============================================
SELECT 
  COUNT(DISTINCT lottery_name) as lotteries_with_15plus_results
FROM (
  SELECT lottery_name, COUNT(*) as result_count
  FROM lottery_results
  GROUP BY lottery_name
  HAVING COUNT(*) >= 15
) subquery;
-- Debe retornar un número > 0

-- ============================================
-- 5. Ver usuarios premium disponibles
-- ============================================
SELECT 
  COUNT(*) as premium_users,
  COUNT(CASE WHEN is_premium = false THEN 1 END) as regular_users
FROM users;

-- ============================================
-- 6. Test de INSERT/UPDATE (simulación)
-- ============================================
-- NOTA: Reemplazar <USER_ID_PREMIUM> con un ID real de usuario premium

-- Test 1: Intentar insertar estrategia para usuario premium
-- DO $$
-- DECLARE
--   test_user_id INT := <USER_ID_PREMIUM>;
-- BEGIN
--   -- Insertar
--   INSERT INTO user_strategies (user_id, lottery_name, digits_type, parameters)
--   VALUES (test_user_id, 'Medellín', 4, '{}'::jsonb)
--   ON CONFLICT (user_id) 
--   DO UPDATE SET
--     lottery_name = EXCLUDED.lottery_name,
--     digits_type = EXCLUDED.digits_type,
--     updated_at = NOW();
--   
--   RAISE NOTICE 'Estrategia insertada/actualizada correctamente';
--   
--   -- Verificar
--   PERFORM * FROM user_strategies WHERE user_id = test_user_id;
--   IF FOUND THEN
--     RAISE NOTICE 'Verificación OK: estrategia existe';
--   END IF;
--   
--   -- Limpiar test
--   DELETE FROM user_strategies WHERE user_id = test_user_id;
--   RAISE NOTICE 'Test completado y limpiado';
-- END $$;

-- ============================================
-- 7. Verificar índices
-- ============================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_strategies'
ORDER BY indexname;
-- Debe mostrar índices en user_id y lottery_name

-- ============================================
-- RESUMEN: Todo debe pasar sin errores
-- ============================================
SELECT 
  'Sistema de estrategias listo' as status,
  (SELECT COUNT(*) FROM user_strategies) as total_strategies,
  (SELECT COUNT(*) FROM users WHERE is_premium = true) as potential_users;
