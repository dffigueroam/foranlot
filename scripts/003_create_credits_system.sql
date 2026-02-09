-- Tabla de créditos de usuarios premium
CREATE TABLE IF NOT EXISTS user_credits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_credits INTEGER DEFAULT 0,
  used_credits INTEGER DEFAULT 0,
  available_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de selecciones activas (números o usuarios que el premium sigue)
CREATE TABLE IF NOT EXISTS user_selections (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  selection_type VARCHAR(20) NOT NULL, -- 'number' o 'user'
  selected_number VARCHAR(4), -- Si es tipo 'number'
  selected_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Si es tipo 'user'
  lottery_type VARCHAR(10) NOT NULL,
  credits_per_day INTEGER DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE, -- Calculado basado en créditos disponibles
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_deduction_date DATE DEFAULT CURRENT_DATE,
  CONSTRAINT check_selection_type CHECK (
    (selection_type = 'number' AND selected_number IS NOT NULL) OR
    (selection_type = 'user' AND selected_user_id IS NOT NULL)
  )
);

-- Tabla de historial de uso de créditos
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  selection_id INTEGER REFERENCES user_selections(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Positivo para añadir, negativo para descontar
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'daily_deduction', 'refund', 'bonus'
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones internas
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'credit_low', 'credit_expired', 'selection_expired', 'new_prediction'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_selection_id INTEGER REFERENCES user_selections(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_selections_subscriber ON user_selections(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_user_selections_active ON user_selections(is_active);
CREATE INDEX IF NOT EXISTS idx_user_selections_expiry ON user_selections(expiry_date);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Función para calcular fecha de vencimiento basada en créditos disponibles
CREATE OR REPLACE FUNCTION calculate_expiry_date(
  p_user_id INTEGER,
  p_credits_per_day INTEGER
) RETURNS DATE AS $$
DECLARE
  v_available_credits INTEGER;
  v_days_remaining INTEGER;
BEGIN
  SELECT available_credits INTO v_available_credits
  FROM user_credits
  WHERE user_id = p_user_id;
  
  IF v_available_credits IS NULL OR v_available_credits <= 0 THEN
    RETURN CURRENT_DATE;
  END IF;
  
  v_days_remaining := v_available_credits / p_credits_per_day;
  
  RETURN CURRENT_DATE + v_days_remaining;
END;
$$ LANGUAGE plpgsql;

-- Función trigger para actualizar expiry_date automáticamente
CREATE OR REPLACE FUNCTION update_selection_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expiry_date := calculate_expiry_date(NEW.subscriber_id, NEW.credits_per_day);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_selection_expiry
BEFORE INSERT OR UPDATE ON user_selections
FOR EACH ROW
EXECUTE FUNCTION update_selection_expiry();
