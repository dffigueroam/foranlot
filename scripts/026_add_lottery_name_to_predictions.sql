-- Agregar columna lottery_name a la tabla predictions
-- Esta columna es necesaria para asociar cada predicción con una lotería específica

ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS lottery_name VARCHAR(100) DEFAULT 'sin_definir';

-- Crear índice en lottery_name para mejoro de performance
CREATE INDEX IF NOT EXISTS idx_predictions_lottery_name ON predictions(lottery_name);

-- Agregar la columna visibility si no existe (necesaria para control de privacidad)
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private';

-- Verificar estructura actual
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'predictions' ORDER BY ordinal_position;
