-- Verificar que la tabla user_strategies existe y tiene la estructura correcta

-- 1. Verificar existencia de la tabla
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'user_strategies';

-- 2. Verificar columnas
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_strategies'
ORDER BY ordinal_position;

-- 3. Verificar constraints
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'user_strategies';

-- 4. Verificar índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'user_strategies';

-- 5. Contar registros existentes
SELECT COUNT(*) as total_strategies FROM user_strategies;

-- 6. Ver ejemplo de datos (si existen)
SELECT 
  id,
  user_id,
  lottery_name,
  digits_type,
  jsonb_pretty(parameters) as parameters_formatted,
  created_at,
  updated_at
FROM user_strategies
LIMIT 5;
