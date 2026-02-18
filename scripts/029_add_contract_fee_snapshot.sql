-- Agrega columna para guardar la tarifa pactada de créditos al cerrar contrato
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS tarifa_creditos_pactada INTEGER;

-- Cuando se cierra un contrato, guardar el valor vigente de la tarifa de créditos en este campo.
