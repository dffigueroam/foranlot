-- Script para Feature 28: Multiplicadores de Contratos Premium
-- Permitir que usuarios premium compren slots adicionales de contratos

-- 1. Tabla de slots de contratos comprados
CREATE TABLE IF NOT EXISTS contract_slots_purchased (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  slot_type VARCHAR(20) NOT NULL CHECK (slot_type IN ('synthetic', 'organic')),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER NOT NULL, -- Precio pagado en centavos
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255), -- Si es recurrente
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP, -- NULL = indefinido, o fecha específica
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de precios de slots (referencia)
CREATE TABLE IF NOT EXISTS contract_slot_prices (
  id SERIAL PRIMARY KEY,
  slot_type VARCHAR(20) NOT NULL CHECK (slot_type IN ('synthetic', 'organic')),
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly', 'one-time'
  stripe_product_id VARCHAR(255),
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slot_type, billing_period)
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_contract_slots_user_id ON contract_slots_purchased(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_slots_active ON contract_slots_purchased(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_contract_slots_type ON contract_slots_purchased(slot_type, is_active);

-- 4. Insertar precios por defecto
INSERT INTO contract_slot_prices (slot_type, price_cents, currency, billing_period, is_active) VALUES
  ('synthetic', 500, 'USD', 'monthly', TRUE),   -- $5/mes por slot sintético adicional
  ('organic', 300, 'USD', 'monthly', TRUE),     -- $3/mes por slot orgánico adicional
  ('synthetic', 5000, 'USD', 'yearly', TRUE),   -- $50/año por slot sintético (2 meses gratis)
  ('organic', 3000, 'USD', 'yearly', TRUE)      -- $30/año por slot orgánico (2 meses gratis)
ON CONFLICT (slot_type, billing_period) DO NOTHING;

-- 5. Función para obtener límites totales de contratos (base + comprados)
CREATE OR REPLACE FUNCTION get_user_contract_limits(p_user_id INTEGER)
RETURNS TABLE(
  synthetic_base INTEGER,
  organic_base INTEGER,
  synthetic_purchased INTEGER,
  organic_purchased INTEGER,
  synthetic_total INTEGER,
  organic_total INTEGER,
  synthetic_active_contracts INTEGER,
  organic_active_contracts INTEGER,
  can_add_synthetic BOOLEAN,
  can_add_organic BOOLEAN
) AS $$
DECLARE
  v_synthetic_purchased INTEGER;
  v_organic_purchased INTEGER;
  v_synthetic_active INTEGER;
  v_organic_active INTEGER;
BEGIN
  -- Contar slots sintéticos comprados y activos
  SELECT COALESCE(SUM(quantity), 0) INTO v_synthetic_purchased
  FROM contract_slots_purchased
  WHERE user_id = p_user_id
    AND slot_type = 'synthetic'
    AND is_active = TRUE
    AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP);

  -- Contar slots orgánicos comprados y activos
  SELECT COALESCE(SUM(quantity), 0) INTO v_organic_purchased
  FROM contract_slots_purchased
  WHERE user_id = p_user_id
    AND slot_type = 'organic'
    AND is_active = TRUE
    AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP);

  -- Contar contratos activos actuales (del mes actual)
  SELECT 
    COUNT(*) FILTER (WHERE is_synthetic_target = TRUE),
    COUNT(*) FILTER (WHERE is_synthetic_target = FALSE)
  INTO v_synthetic_active, v_organic_active
  FROM user_selections
  WHERE subscriber_id = p_user_id
    AND is_active = TRUE
    AND start_date >= DATE_TRUNC('month', CURRENT_DATE);

  -- Retornar resultados
  RETURN QUERY SELECT
    1::INTEGER AS synthetic_base,           -- Base incluido en membresía
    2::INTEGER AS organic_base,             -- Base incluido en membresía
    v_synthetic_purchased AS synthetic_purchased,
    v_organic_purchased AS organic_purchased,
    (1 + v_synthetic_purchased)::INTEGER AS synthetic_total,
    (2 + v_organic_purchased)::INTEGER AS organic_total,
    v_synthetic_active AS synthetic_active_contracts,
    v_organic_active AS organic_active_contracts,
    (v_synthetic_active < (1 + v_synthetic_purchased))::BOOLEAN AS can_add_synthetic,
    (v_organic_active < (2 + v_organic_purchased))::BOOLEAN AS can_add_organic;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para registrar compra de slot
CREATE OR REPLACE FUNCTION purchase_contract_slot(
  p_user_id INTEGER,
  p_slot_type VARCHAR(20),
  p_quantity INTEGER,
  p_price_cents INTEGER,
  p_stripe_payment_intent_id VARCHAR(255),
  p_stripe_subscription_id VARCHAR(255) DEFAULT NULL,
  p_billing_period VARCHAR(20) DEFAULT 'monthly'
)
RETURNS INTEGER AS $$
DECLARE
  v_slot_id INTEGER;
  v_valid_until TIMESTAMP;
BEGIN
  -- Calcular valid_until según período de facturación
  IF p_billing_period = 'monthly' THEN
    v_valid_until := CURRENT_TIMESTAMP + INTERVAL '30 days';
  ELSIF p_billing_period = 'yearly' THEN
    v_valid_until := CURRENT_TIMESTAMP + INTERVAL '365 days';
  ELSE
    v_valid_until := NULL; -- Indefinido para one-time
  END IF;

  -- Insertar compra
  INSERT INTO contract_slots_purchased (
    user_id,
    slot_type,
    quantity,
    price_cents,
    stripe_payment_intent_id,
    stripe_subscription_id,
    valid_until
  ) VALUES (
    p_user_id,
    p_slot_type,
    p_quantity,
    p_price_cents,
    p_stripe_payment_intent_id,
    p_stripe_subscription_id,
    v_valid_until
  )
  RETURNING id INTO v_slot_id;

  -- Crear notificación para el usuario
  INSERT INTO notifications (
    user_id,
    type,
    message,
    is_read
  ) VALUES (
    p_user_id,
    'slot_purchase',
    format('Has adquirido %s slot(s) adicional(es) de contratos %s', 
           p_quantity, 
           CASE WHEN p_slot_type = 'synthetic' THEN 'sintéticos' ELSE 'orgánicos' END),
    FALSE
  );

  RETURN v_slot_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para desactivar slots vencidos (cron job)
CREATE OR REPLACE FUNCTION deactivate_expired_slots()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Desactivar slots vencidos
  UPDATE contract_slots_purchased
  SET is_active = FALSE,
      updated_at = CURRENT_TIMESTAMP
  WHERE is_active = TRUE
    AND valid_until IS NOT NULL
    AND valid_until < CURRENT_TIMESTAMP
  RETURNING 1 INTO v_updated_count;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- Crear notificaciones para usuarios afectados
  INSERT INTO notifications (user_id, type, message, is_read)
  SELECT DISTINCT
    user_id,
    'slot_expired',
    format('Tu slot adicional de contratos %s ha expirado', 
           CASE WHEN slot_type = 'synthetic' THEN 'sintéticos' ELSE 'orgánicos' END),
    FALSE
  FROM contract_slots_purchased
  WHERE is_active = FALSE
    AND valid_until IS NOT NULL
    AND valid_until < CURRENT_TIMESTAMP
    AND updated_at > CURRENT_TIMESTAMP - INTERVAL '1 minute';

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_slots_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_slots_timestamp
BEFORE UPDATE ON contract_slots_purchased
FOR EACH ROW
EXECUTE FUNCTION update_contract_slots_timestamp();

-- 9. Vista para reportes de slots
CREATE OR REPLACE VIEW v_contract_slots_summary AS
SELECT 
  u.id AS user_id,
  u.username,
  u.email,
  u.is_premium,
  COALESCE(SUM(CASE WHEN csp.slot_type = 'synthetic' AND csp.is_active THEN csp.quantity ELSE 0 END), 0) AS synthetic_slots_purchased,
  COALESCE(SUM(CASE WHEN csp.slot_type = 'organic' AND csp.is_active THEN csp.quantity ELSE 0 END), 0) AS organic_slots_purchased,
  (1 + COALESCE(SUM(CASE WHEN csp.slot_type = 'synthetic' AND csp.is_active THEN csp.quantity ELSE 0 END), 0)) AS synthetic_total_slots,
  (2 + COALESCE(SUM(CASE WHEN csp.slot_type = 'organic' AND csp.is_active THEN csp.quantity ELSE 0 END), 0)) AS organic_total_slots,
  COALESCE(SUM(CASE WHEN csp.is_active THEN csp.price_cents ELSE 0 END), 0) AS total_spent_cents
FROM users u
LEFT JOIN contract_slots_purchased csp ON u.id = csp.user_id
WHERE u.is_premium = TRUE
GROUP BY u.id, u.username, u.email, u.is_premium;

-- 10. Comentarios
COMMENT ON TABLE contract_slots_purchased IS 'Tracking de slots de contratos adicionales comprados por usuarios premium';
COMMENT ON TABLE contract_slot_prices IS 'Catálogo de precios para slots adicionales';
COMMENT ON FUNCTION get_user_contract_limits(INTEGER) IS 'Obtiene límites totales de contratos (base + comprados)';
COMMENT ON FUNCTION purchase_contract_slot IS 'Registra compra de slot adicional';
COMMENT ON FUNCTION deactivate_expired_slots() IS 'Desactiva slots vencidos (ejecutar diariamente vía cron)';
COMMENT ON VIEW v_contract_slots_summary IS 'Resumen de slots por usuario para reportes admin';
