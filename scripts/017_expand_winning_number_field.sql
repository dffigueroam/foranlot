-- Expandir el campo winning_number para acomodar strings más largos
-- permitindo valores como "1950" o información adicional

ALTER TABLE lottery_results 
ALTER COLUMN winning_number SET DATA TYPE VARCHAR(30);

-- Actualizar índices relevantes si es necesario
CREATE INDEX IF NOT EXISTS idx_lottery_results_winning_number 
ON lottery_results(winning_number);
