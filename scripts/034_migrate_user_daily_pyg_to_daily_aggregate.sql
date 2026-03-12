DO $$
DECLARE
  table_exists boolean;
  has_prediction_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_daily_pyg'
  ) INTO table_exists;

  IF NOT table_exists THEN
    CREATE TABLE user_daily_pyg (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cantidad_pronosticos INTEGER NOT NULL DEFAULT 0,
      valor_inversion INTEGER NOT NULL DEFAULT 0,
      valor_ganado INTEGER NOT NULL DEFAULT 0,
      fecha_pronostico DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_daily_pyg_unique_user_date
      ON user_daily_pyg(user_id, fecha_pronostico);

    CREATE INDEX IF NOT EXISTS idx_user_daily_pyg_user_date
      ON user_daily_pyg(user_id, fecha_pronostico DESC);

    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_daily_pyg'
      AND column_name = 'prediction_id'
  ) INTO has_prediction_id;

  IF has_prediction_id THEN
    CREATE TABLE IF NOT EXISTS user_daily_pyg_new (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cantidad_pronosticos INTEGER NOT NULL DEFAULT 0,
      valor_inversion INTEGER NOT NULL DEFAULT 0,
      valor_ganado INTEGER NOT NULL DEFAULT 0,
      fecha_pronostico DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO user_daily_pyg_new (
      user_id,
      cantidad_pronosticos,
      valor_inversion,
      valor_ganado,
      fecha_pronostico,
      created_at,
      updated_at
    )
    SELECT
      user_id,
      COUNT(*)::int AS cantidad_pronosticos,
      COALESCE(SUM(valor_inversion), 0)::int AS valor_inversion,
      COALESCE(SUM(valor_ganado), 0)::int AS valor_ganado,
      fecha_pronostico,
      MIN(created_at) AS created_at,
      MAX(updated_at) AS updated_at
    FROM user_daily_pyg
    GROUP BY user_id, fecha_pronostico;

    ALTER TABLE user_daily_pyg RENAME TO user_daily_pyg_legacy_034;
    ALTER TABLE user_daily_pyg_new RENAME TO user_daily_pyg;
  END IF;

  ALTER TABLE user_daily_pyg
    ADD COLUMN IF NOT EXISTS cantidad_pronosticos INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS valor_inversion INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS valor_ganado INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fecha_pronostico DATE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

  UPDATE user_daily_pyg
  SET fecha_pronostico = CURRENT_DATE
  WHERE fecha_pronostico IS NULL;

  ALTER TABLE user_daily_pyg
    ALTER COLUMN fecha_pronostico SET NOT NULL;

  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_daily_pyg_unique_user_date
    ON user_daily_pyg(user_id, fecha_pronostico);

  CREATE INDEX IF NOT EXISTS idx_user_daily_pyg_user_date
    ON user_daily_pyg(user_id, fecha_pronostico DESC);
END $$;

COMMENT ON TABLE user_daily_pyg IS 'P&G diario acumulado por usuario';
COMMENT ON COLUMN user_daily_pyg.cantidad_pronosticos IS 'Total de pronósticos publicados por el usuario en la fecha';
COMMENT ON COLUMN user_daily_pyg.valor_inversion IS 'Inversión acumulada del día';
COMMENT ON COLUMN user_daily_pyg.valor_ganado IS 'Valor ganado acumulado del día tras verificaciones';
COMMENT ON COLUMN user_daily_pyg.fecha_pronostico IS 'Fecha del sorteo/pronóstico para la acumulación diaria';