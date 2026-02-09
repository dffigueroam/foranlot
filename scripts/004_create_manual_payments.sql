-- Tabla para solicitudes de pago manual (transferencia/consignación)
CREATE TABLE IF NOT EXISTS manual_payment_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL, -- 'monthly' o 'annual'
  amount_cents INTEGER NOT NULL,
  credits_to_add INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'transfer', -- 'transfer' o 'deposit'
  receipt_url TEXT, -- URL del comprobante subido
  reference_number VARCHAR(100), -- Número de referencia del pago
  bank_name VARCHAR(100),
  payment_date DATE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_manual_payments_user_id ON manual_payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_created ON manual_payment_requests(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_manual_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_manual_payment_timestamp
BEFORE UPDATE ON manual_payment_requests
FOR EACH ROW
EXECUTE FUNCTION update_manual_payment_timestamp();
