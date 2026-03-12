DO $$
DECLARE
  legacy_exists boolean;
  current_exists boolean;
  legacy_rows bigint := 0;
  current_rows bigint := 0;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_daily_pyg_legacy_034'
  ) INTO legacy_exists;

  IF NOT legacy_exists THEN
    RAISE NOTICE 'No existe user_daily_pyg_legacy_034. Nada para limpiar.';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_daily_pyg'
  ) INTO current_exists;

  IF NOT current_exists THEN
    RAISE EXCEPTION 'No existe user_daily_pyg. Se cancela limpieza para evitar pérdida de datos.';
  END IF;

  EXECUTE 'SELECT COUNT(*) FROM user_daily_pyg_legacy_034' INTO legacy_rows;
  EXECUTE 'SELECT COUNT(*) FROM user_daily_pyg' INTO current_rows;

  IF current_rows = 0 AND legacy_rows > 0 THEN
    RAISE EXCEPTION 'user_daily_pyg está vacío y legacy tiene datos. Revisa migración 034 antes de limpiar.';
  END IF;

  DROP TABLE user_daily_pyg_legacy_034;

  RAISE NOTICE 'Limpieza completada. Filas legacy: %, filas actuales: %.', legacy_rows, current_rows;
END $$;