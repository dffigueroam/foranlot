-- Agregar nombre de estrategia a user_strategies
ALTER TABLE user_strategies
ADD COLUMN IF NOT EXISTS strategy_name VARCHAR(120) NOT NULL DEFAULT '';

-- Opcional: garantizar que no quede vacio si ya habia registros
UPDATE user_strategies
SET strategy_name = 'Estrategia sin nombre'
WHERE strategy_name = '';

COMMENT ON COLUMN user_strategies.strategy_name IS 'Nombre visible de la estrategia';
