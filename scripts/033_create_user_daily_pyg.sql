CREATE TABLE IF NOT EXISTS user_daily_pyg (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cantidad_pronosticos INTEGER NOT NULL DEFAULT 0,
  valor_inversion INTEGER NOT NULL DEFAULT 100,
  valor_ganado INTEGER NOT NULL DEFAULT 0,
  fecha_pronostico DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_daily_pyg_unique_user_date
  ON user_daily_pyg(user_id, fecha_pronostico);

CREATE INDEX IF NOT EXISTS idx_user_daily_pyg_user_date
  ON user_daily_pyg(user_id, fecha_pronostico DESC);

COMMENT ON TABLE user_daily_pyg IS 'P&G diario acumulado por usuario';
COMMENT ON COLUMN user_daily_pyg.cantidad_pronosticos IS 'Total de pronósticos publicados por el usuario en la fecha';
COMMENT ON COLUMN user_daily_pyg.valor_inversion IS 'Inversión acumulada del día';
COMMENT ON COLUMN user_daily_pyg.valor_ganado IS 'Valor ganado acumulado del día tras verificaciones';
COMMENT ON COLUMN user_daily_pyg.fecha_pronostico IS 'Fecha del sorteo/pronóstico para la acumulación diaria';