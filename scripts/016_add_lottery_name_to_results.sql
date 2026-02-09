-- Agregar columnas faltantes a lottery_results
-- Esto permite guardar completamente: lottery_name, winning_number descriptivo, y dígitos por formato

ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS lottery_name VARCHAR(100);

ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS digits_4 VARCHAR(4);

ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS digits_3 VARCHAR(3);

ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS digits_2 VARCHAR(2);

ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS draw_time VARCHAR(20);

ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS source VARCHAR(50);

ALTER TABLE lottery_results 
ADD COLUMN IF NOT EXISTS verified_by INTEGER;

-- Actualizar el unique constraint para incluir lottery_name
-- Primero eliminar el constraint antiguo
ALTER TABLE lottery_results 
DROP CONSTRAINT IF EXISTS lottery_results_lottery_type_draw_date_draw_time_key;

ALTER TABLE lottery_results 
DROP CONSTRAINT IF EXISTS lottery_results_lottery_type_draw_date_key;

-- Agregar nuevo unique constraint con lottery_name y draw_date
CREATE UNIQUE INDEX IF NOT EXISTS idx_lottery_results_unique 
ON lottery_results(lottery_name, draw_date);

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_lottery_results_name 
ON lottery_results(lottery_name);

CREATE INDEX IF NOT EXISTS idx_lottery_results_digits_4 
ON lottery_results(digits_4);
