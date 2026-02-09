-- Verificar y recrear la tabla lottery_results con esquema correcto
-- Esta migración asegura que la tabla tenga todas las columnas necesarias

-- Dropear la tabla si existe (por seguridad, en un escenario de error)
-- DROP TABLE IF EXISTS lottery_results CASCADE;

-- Crear la tabla lottery_results con el esquema correcto
CREATE TABLE IF NOT EXISTS lottery_results (
  id SERIAL PRIMARY KEY,
  lottery_type VARCHAR(10) NOT NULL,
  winning_number VARCHAR(4) NOT NULL,
  draw_date DATE NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lottery_type, draw_date)
);

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_lottery_results_date ON lottery_results(draw_date);
CREATE INDEX IF NOT EXISTS idx_lottery_results_type ON lottery_results(lottery_type);

-- Si la tabla ya existía pero falta la columna lottery_type, esto la agregará:
-- ALTER TABLE lottery_results ADD COLUMN IF NOT EXISTS lottery_type VARCHAR(10);
