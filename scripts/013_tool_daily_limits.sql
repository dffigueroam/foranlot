-- Crear tabla para rastrear límites diarios de herramientas
CREATE TABLE IF NOT EXISTS tool_daily_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, usage_date)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tool_daily_limits_user_date ON tool_daily_limits(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_tool_daily_limits_usage_date ON tool_daily_limits(usage_date);

-- Asegurar que tool_usage existe con todas las columnas necesarias
CREATE TABLE IF NOT EXISTS tool_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id INTEGER NOT NULL REFERENCES prediction_tools(id) ON DELETE CASCADE,
  lottery_type VARCHAR(20),
  usage_date DATE DEFAULT CURRENT_DATE,
  is_free_daily BOOLEAN DEFAULT FALSE,
  credits_used INTEGER DEFAULT 0,
  input_data JSONB,
  result_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para tool_usage
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_date ON tool_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_id ON tool_usage(tool_id);
