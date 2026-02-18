-- Tabla de tarifas de membresía históricas
CREATE TABLE IF NOT EXISTS membership_fees (
  id SERIAL PRIMARY KEY,
  tarifa_mes INTEGER NOT NULL, -- Valor en pesos de la membresía mensual
  fecha_inicial DATE NOT NULL,
  fecha_final DATE DEFAULT '2999-12-31' -- Si es indefinida, se deja 2999-12-31
);

-- Insertar tarifa actual (ejemplo)
INSERT INTO membership_fees (tarifa_mes, fecha_inicial)
VALUES (25995, '2024-01-01');
