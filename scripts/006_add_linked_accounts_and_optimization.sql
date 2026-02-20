-- 006_add_linked_accounts_and_optimization.sql

-- Tabla para vincular cuentas gratis a premium para optimización generativa
CREATE TABLE linked_accounts (
    id SERIAL PRIMARY KEY,
    premium_user_id INTEGER NOT NULL REFERENCES users(id),
    free_user_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(16) NOT NULL DEFAULT 'active', -- active | inactive | removed
    linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    unlinked_at TIMESTAMP,
    optimization_start_date DATE, -- Fecha desde la que se empieza a optimizar
    optimization_end_date DATE,   -- Fecha de desvinculación
    total_days_linked INT DEFAULT 0, -- Días totales de vinculación
    CONSTRAINT unique_linked_account UNIQUE (premium_user_id, free_user_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_linked_accounts_premium ON linked_accounts(premium_user_id);
CREATE INDEX idx_linked_accounts_free ON linked_accounts(free_user_id);

-- Tabla para registrar el historial de optimizaciones generativas
CREATE TABLE optimization_history (
    id SERIAL PRIMARY KEY,
    premium_user_id INTEGER NOT NULL REFERENCES users(id),
    free_user_id INTEGER NOT NULL REFERENCES users(id),
    optimized_at TIMESTAMP NOT NULL DEFAULT NOW(),
    original_prediction_id INTEGER REFERENCES predictions(id),
    optimized_prediction TEXT NOT NULL, -- El resultado sugerido por IA
    status VARCHAR(16) NOT NULL DEFAULT 'suggested', -- suggested | accepted | rejected
    shown_to_user BOOLEAN DEFAULT FALSE
);

-- Restricciones adicionales y triggers pueden agregarse según lógica de negocio.