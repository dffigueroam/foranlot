-- Tabla para almacenar estrategias de usuarios premium
-- Máximo 1 estrategia por usuario
CREATE TABLE IF NOT EXISTS user_strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lottery_name VARCHAR(100) NOT NULL,
  digits_type INTEGER NOT NULL CHECK (digits_type IN (3, 4, 5)),
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Un usuario solo puede tener 1 estrategia
  UNIQUE(user_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_strategies_user_id ON user_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_strategies_lottery_name ON user_strategies(lottery_name);

-- Comentarios explicativos
COMMENT ON TABLE user_strategies IS 'Estrategias personalizadas para usuarios premium (máximo 1 por usuario)';
COMMENT ON COLUMN user_strategies.user_id IS 'Usuario dueño de la estrategia (debe ser premium)';
COMMENT ON COLUMN user_strategies.lottery_name IS 'Nombre de la lotería a la que aplica';
COMMENT ON COLUMN user_strategies.digits_type IS 'Tipo de dígitos: 3, 4 o 5';
COMMENT ON COLUMN user_strategies.parameters IS 'Parámetros adicionales de la estrategia en formato JSON';
