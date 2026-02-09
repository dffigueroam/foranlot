-- Expandir campos numéricos en la tabla predictions
-- para acomodar valores más largos

ALTER TABLE predictions 
ALTER COLUMN predicted_number SET DATA TYPE VARCHAR(30);

ALTER TABLE predictions 
ALTER COLUMN actual_number SET DATA TYPE VARCHAR(30);

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_predictions_predicted_number 
ON predictions(predicted_number);

CREATE INDEX IF NOT EXISTS idx_predictions_actual_number 
ON predictions(actual_number);
