-- 010_create_lotteries.sql
-- Crea la tabla lotteries para migrar la definición al backend

CREATE TABLE lotteries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    country VARCHAR(32) NOT NULL,
    dias VARCHAR(32) NOT NULL, -- Ejemplo: 'lunes,martes,miércoles'
    digits INTEGER[] NOT NULL, -- Ejemplo: '{3,4,5}'
    time INTEGER NOT NULL,     -- Hora local del sorteo (0-23)
    is_active BOOLEAN DEFAULT TRUE
);

-- Índices útiles
CREATE INDEX idx_lotteries_country ON lotteries(country);
CREATE INDEX idx_lotteries_is_active ON lotteries(is_active);

-- Puedes agregar más campos según necesidades futuras (por ejemplo, API URL, descripción, etc.)

-- NOTA: El siguiente paso será migrar los datos actuales desde lib/lotteries.ts a esta tabla.
