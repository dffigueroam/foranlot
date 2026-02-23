-- Script para implementar sistema de límites de uso diario de herramientas
-- Punto 23: 3 usos/día gratis, 10 usos/día premium por herramienta

-- 1. Tabla de límites de uso diario
CREATE TABLE IF NOT EXISTS daily_tool_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_uses INTEGER DEFAULT 0,
  free_uses_remaining INTEGER DEFAULT 12,
  premium_uses_remaining INTEGER DEFAULT 30,
  last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, usage_date)
);

-- 2. Tabla de uso por herramienta específica (tracking detallado)
CREATE TABLE IF NOT EXISTS tool_usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  lottery_type VARCHAR(20) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER DEFAULT 1,
  is_premium_user BOOLEAN DEFAULT FALSE,
  input_numbers TEXT,
  result_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. İndices para optimización
CREATE INDEX IF NOT EXISTS idx_daily_tool_limits_user_date 
ON daily_tool_limits(user_id, usage_date);

CREATE INDEX IF NOT EXISTS idx_tool_usage_tracking_user_date 
ON tool_usage_tracking(user_id, usage_date, tool_name);

-- 4. Función para obtener límites del usuario del día
CREATE OR REPLACE FUNCTION get_user_daily_limits(p_user_id INTEGER)
RETURNS TABLE(
  total_uses INTEGER,
  free_remaining INTEGER,
  premium_remaining INTEGER,
  is_premium BOOLEAN
) AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_limits RECORD;
BEGIN
  -- Verificar si el usuario es premium
  SELECT users.is_premium INTO v_is_premium
  FROM users
  WHERE id = p_user_id;
  
  -- Obtener o crear límites del día
  SELECT * INTO v_limits
  FROM daily_tool_limits
  WHERE user_id = p_user_id
  AND usage_date = CURRENT_DATE;
  
  -- Si no existe, crear con valores iniciales
  IF NOT FOUND THEN
    INSERT INTO daily_tool_limits (
      user_id,
      usage_date,
      total_uses,
      free_uses_remaining,
      premium_uses_remaining
    ) VALUES (
      p_user_id,
      CURRENT_DATE,
      0,
      10,
      10
    )
    RETURNING * INTO v_limits;
  END IF;
  
  RETURN QUERY
  SELECT 
    v_limits.total_uses,
    v_limits.free_uses_remaining,
    v_limits.premium_uses_remaining,
    v_is_premium;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para verificar si puede usar herramienta
CREATE OR REPLACE FUNCTION can_use_tool(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_free_remaining INTEGER;
  v_premium_remaining INTEGER;
BEGIN
  SELECT is_premium INTO v_is_premium
  FROM users
  WHERE id = p_user_id;
  
  SELECT free_uses_remaining, premium_uses_remaining
  INTO v_free_remaining, v_premium_remaining
  FROM daily_tool_limits
  WHERE user_id = p_user_id
  AND usage_date = CURRENT_DATE;
  
  -- Si no hay registro, puede usar (se creará al usar)
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  
  -- Usuario premium: verificar límite premium
  IF v_is_premium THEN
    RETURN v_premium_remaining > 0;
  ELSE
    -- Usuario gratis: verificar límite gratis
    RETURN v_free_remaining > 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para registrar uso de herramienta
CREATE OR REPLACE FUNCTION record_tool_use(
  p_user_id INTEGER,
  p_tool_name VARCHAR(100),
  p_lottery_type VARCHAR(20),
  p_input_numbers TEXT DEFAULT NULL,
  p_result_summary TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_limits RECORD;
BEGIN
  -- Verificar si es premium
  SELECT is_premium INTO v_is_premium
  FROM users
  WHERE id = p_user_id;
  
  -- Obtener o crear límites
  SELECT * INTO v_limits
  FROM get_user_daily_limits(p_user_id);
  
  -- Verificar si puede usar
  IF v_is_premium AND v_limits.premium_remaining <= 0 THEN
    RETURN FALSE;
  END IF;
  
  IF NOT v_is_premium AND v_limits.free_remaining <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Actualizar límites
  IF v_is_premium THEN
    UPDATE daily_tool_limits
    SET total_uses = total_uses + 1,
        premium_uses_remaining = premium_uses_remaining - 1
    WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE;
  ELSE
    UPDATE daily_tool_limits
    SET total_uses = total_uses + 1,
        free_uses_remaining = free_uses_remaining - 1
    WHERE user_id = p_user_id
    AND usage_date = CURRENT_DATE;
  END IF;
  
  -- Registrar uso en tracking
  INSERT INTO tool_usage_tracking (
    user_id,
    tool_name,
    lottery_type,
    usage_date,
    is_premium_user,
    input_numbers,
    result_summary
  ) VALUES (
    p_user_id,
    p_tool_name,
    p_lottery_type,
    CURRENT_DATE,
    v_is_premium,
    p_input_numbers,
    p_result_summary
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para resetear límites a medianoche (ejecutar vía cron)
CREATE OR REPLACE FUNCTION reset_daily_tool_limits()
RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER;
BEGIN
  -- Eliminar registros de días anteriores (opcional, para limpieza)
  DELETE FROM daily_tool_limits
  WHERE usage_date < CURRENT_DATE - INTERVAL '7 days';
  
  -- Contar registros de hoy (para estadísticas)
  SELECT COUNT(*) INTO v_reset_count
  FROM daily_tool_limits
  WHERE usage_date = CURRENT_DATE;
  
  RETURN v_reset_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Comentarios explicativos
COMMENT ON TABLE daily_tool_limits IS 'Límites de uso diario: 3 gratis, 10 premium';
COMMENT ON TABLE tool_usage_tracking IS 'Tracking detallado de cada uso de herramienta';
COMMENT ON FUNCTION get_user_daily_limits IS 'Obtiene límites del usuario para el día actual';
COMMENT ON FUNCTION can_use_tool IS 'Verifica si el usuario puede usar una herramienta hoy';
COMMENT ON FUNCTION record_tool_use IS 'Registra el uso de una herramienta y decrementa límites';
COMMENT ON FUNCTION reset_daily_tool_limits IS 'Limpia registros antiguos (ejecutar diario en cron)';

COMMIT;
