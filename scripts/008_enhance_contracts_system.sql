-- Script para mejorar sistema de contratos premium
-- Punto 25 y 26: Renovación automática + diferenciación sintéticos/orgánicos

-- 1. Agregar columnas necesarias a user_selections
ALTER TABLE user_selections 
ADD COLUMN IF NOT EXISTS contract_duration VARCHAR(20) DEFAULT 'weekly', -- 'weekly', 'monthly'
ADD COLUMN IF NOT EXISTS is_synthetic_target BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS renewal_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_renewal_date TIMESTAMP;

-- 2. Índices para optimizar consultas de renovación
CREATE INDEX IF NOT EXISTS idx_user_selections_expiry_active 
ON user_selections(expiry_date, is_active) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_selections_synthetic 
ON user_selections(subscriber_id, is_synthetic_target, is_active);

-- 3. Función para verificar límites de contratos por mes
CREATE OR REPLACE FUNCTION get_active_contracts_count(
  p_user_id INTEGER,
  p_is_synthetic BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_selections
  WHERE subscriber_id = p_user_id
    AND is_active = TRUE
    AND is_synthetic_target = p_is_synthetic
    AND start_date >= DATE_TRUNC('month', CURRENT_DATE);
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 4. Función para obtener contratos que vencen pronto (para notificaciones)
CREATE OR REPLACE FUNCTION get_expiring_contracts(
  p_days_before INTEGER DEFAULT 1
) RETURNS TABLE (
  selection_id INTEGER,
  subscriber_id INTEGER,
  username VARCHAR(100),
  email VARCHAR(255),
  expiry_date DATE,
  days_until_expiry INTEGER,
  available_credits INTEGER,
  can_auto_renew BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.subscriber_id,
    u.username,
    u.email,
    s.expiry_date,
    (s.expiry_date - CURRENT_DATE)::INTEGER as days_until_expiry,
    uc.available_credits,
    (s.auto_renew AND uc.available_credits >= s.credits_per_day * 7) as can_auto_renew
  FROM user_selections s
  JOIN users u ON s.subscriber_id = u.id
  LEFT JOIN user_credits uc ON uc.user_id = u.id
  WHERE s.is_active = TRUE
    AND s.expiry_date IS NOT NULL
    AND s.expiry_date <= CURRENT_DATE + p_days_before
    AND s.expiry_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para renovar contrato automáticamente
CREATE OR REPLACE FUNCTION auto_renew_contract(
  p_selection_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_selection RECORD;
  v_available_credits INTEGER;
  v_new_expiry_date DATE;
  v_duration_days INTEGER;
BEGIN
  -- Obtener datos del contrato
  SELECT * INTO v_selection
  FROM user_selections
  WHERE id = p_selection_id
    AND is_active = TRUE
    AND auto_renew = TRUE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar créditos disponibles
  SELECT available_credits INTO v_available_credits
  FROM user_credits
  WHERE user_id = v_selection.subscriber_id;
  
  -- Calcular días según duración del contrato
  v_duration_days := CASE 
    WHEN v_selection.contract_duration = 'weekly' THEN 7
    WHEN v_selection.contract_duration = 'monthly' THEN 30
    ELSE 7
  END;
  
  -- Verificar si tiene créditos suficientes
  IF v_available_credits < (v_selection.credits_per_day * v_duration_days) THEN
    -- No tiene créditos, desactivar y notificar
    UPDATE user_selections
    SET is_active = FALSE,
        auto_renew = FALSE
    WHERE id = p_selection_id;
    
    INSERT INTO notifications (
      user_id, notification_type, title, message, related_selection_id
    ) VALUES (
      v_selection.subscriber_id,
      'contract_renewal_failed',
      'Contrato no renovado - Sin créditos',
      'Tu contrato no pudo renovarse automáticamente por falta de créditos. Recarga para reactivarlo.',
      p_selection_id
    );
    
    RETURN FALSE;
  END IF;
  
  -- Renovar: extender fecha de vencimiento
  v_new_expiry_date := CURRENT_DATE + v_duration_days;
  
  UPDATE user_selections
  SET expiry_date = v_new_expiry_date,
      last_renewal_date = CURRENT_TIMESTAMP,
      renewal_attempts = renewal_attempts + 1,
      last_deduction_date = CURRENT_DATE
  WHERE id = p_selection_id;
  
  -- Notificar éxito
  INSERT INTO notifications (
    user_id, notification_type, title, message, related_selection_id
  ) VALUES (
    v_selection.subscriber_id,
    'contract_renewed',
    'Contrato renovado automáticamente',
    format('Tu contrato se ha renovado hasta el %s. Nuevo periodo: %s días.',
           v_new_expiry_date, v_duration_days),
    p_selection_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Comentarios explicativos
COMMENT ON COLUMN user_selections.contract_duration IS 'Duración del contrato: weekly (7 días) o monthly (30 días)';
COMMENT ON COLUMN user_selections.is_synthetic_target IS 'TRUE si el contrato es con usuario sintético, FALSE si orgánico';
COMMENT ON COLUMN user_selections.auto_renew IS 'TRUE para renovación automática si hay créditos disponibles';
COMMENT ON COLUMN user_selections.renewal_attempts IS 'Contador de renovaciones automáticas exitosas';

UPDATE user_selections
SET 
  contract_duration = 'weekly',
  is_synthetic_target = EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = user_selections.selected_user_id 
    AND users.is_synthetic = TRUE
  ),
  auto_renew = TRUE
WHERE contract_duration IS NULL;

COMMIT;
