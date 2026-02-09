-- Agregar columnas para aprobacion de sinteticos
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_synthetic_pending BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS synthetic_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS synthetic_specialization VARCHAR(100);

-- Solicitudes pendientes de aprobacion
CREATE TABLE IF NOT EXISTS synthetic_user_pending_updates (
  id SERIAL PRIMARY KEY,
  synthetic_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  proposed_name VARCHAR(150) NOT NULL,
  synthetic_type VARCHAR(20) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_synthetic_updates_status ON synthetic_user_pending_updates(status);

-- Composicion pendiente por solicitud
CREATE TABLE IF NOT EXISTS synthetic_user_pending_composition (
  update_id INTEGER REFERENCES synthetic_user_pending_updates(id) ON DELETE CASCADE,
  organic_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  weight_contribution DECIMAL(5,4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (update_id, organic_user_id)
);
