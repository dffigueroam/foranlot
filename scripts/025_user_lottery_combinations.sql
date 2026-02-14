-- Tabla para guardar las últimas combinaciones de loterías seleccionadas por usuario
CREATE TABLE IF NOT EXISTS user_lottery_combinations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lottery_names TEXT[] NOT NULL,  -- Array de nombres de loterías
  digit_type VARCHAR(10) NOT NULL,  -- ej: "3_digits", "4_digits"
  usage_count INTEGER DEFAULT 0,  -- Contador de veces usado
  is_favorite BOOLEAN DEFAULT FALSE,  -- Marcar como favorito
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Última vez usado
  UNIQUE(user_id, lottery_names, digit_type)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_lottery_combinations_user_id 
  ON user_lottery_combinations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lottery_combinations_created_at 
  ON user_lottery_combinations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_lottery_combinations_favorite 
  ON user_lottery_combinations(user_id, is_favorite DESC, last_used_at DESC);

-- Función para guardar combinación
CREATE OR REPLACE FUNCTION save_lottery_combination(
  p_user_id INTEGER,
  p_lottery_names TEXT[],
  p_digit_type VARCHAR(10)
)
RETURNS TABLE(success BOOLEAN, combination_id INTEGER) AS $$
DECLARE
  v_lottery_names TEXT[];
  v_combination_id INTEGER;
BEGIN
  -- Normalizar: ordenar nombres para evitar duplicados "A,B" vs "B,A"
  v_lottery_names := ARRAY(SELECT unnest(p_lottery_names) ORDER BY 1);
  
  -- Intentar insertar (si existe, actualizar)
  INSERT INTO user_lottery_combinations (user_id, lottery_names, digit_type, usage_count, last_used_at)
  VALUES (p_user_id, v_lottery_names, p_digit_type, 1, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id, lottery_names, digit_type) DO UPDATE
  SET usage_count = user_lottery_combinations.usage_count + 1,
      last_used_at = CURRENT_TIMESTAMP
  RETURNING user_lottery_combinations.id INTO v_combination_id;
  
  RETURN QUERY SELECT true, v_combination_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener últimas combinaciones del usuario (hasta 5, favoritos primero)
CREATE OR REPLACE FUNCTION get_user_last_combinations(
  p_user_id INTEGER,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  id INTEGER,
  lottery_names TEXT[],
  digit_type VARCHAR(10),
  usage_count INTEGER,
  is_favorite BOOLEAN,
  created_at TIMESTAMP,
  last_used_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ulc.id,
    ulc.lottery_names,
    ulc.digit_type,
    ulc.usage_count,
    ulc.is_favorite,
    ulc.created_at,
    ulc.last_used_at
  FROM user_lottery_combinations ulc
  WHERE ulc.user_id = p_user_id
  ORDER BY ulc.is_favorite DESC, ulc.last_used_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar como favorito
CREATE OR REPLACE FUNCTION toggle_favorite_combination(
  p_combination_id INTEGER,
  p_user_id INTEGER
)
RETURNS TABLE(success BOOLEAN, is_favorite BOOLEAN) AS $$
DECLARE
  v_is_favorite BOOLEAN;
BEGIN
  UPDATE user_lottery_combinations
  SET is_favorite = NOT is_favorite
  WHERE id = p_combination_id AND user_id = p_user_id
  RETURNING user_lottery_combinations.is_favorite INTO v_is_favorite;
  
  IF v_is_favorite IS NULL THEN
    RETURN QUERY SELECT false, false;
  ELSE
    RETURN QUERY SELECT true, v_is_favorite;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar combinación
CREATE OR REPLACE FUNCTION delete_lottery_combination(
  p_combination_id INTEGER,
  p_user_id INTEGER
)
RETURNS TABLE(success BOOLEAN) AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM user_lottery_combinations
  WHERE id = p_combination_id AND user_id = p_user_id;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted > 0;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar contador de uso (sin guardar nueva combinación)
CREATE OR REPLACE FUNCTION increment_combination_usage(
  p_combination_id INTEGER,
  p_user_id INTEGER
)
RETURNS TABLE(success BOOLEAN) AS $$
BEGIN
  UPDATE user_lottery_combinations
  SET usage_count = usage_count + 1,
      last_used_at = CURRENT_TIMESTAMP
  WHERE id = p_combination_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT FOUND;
END;
$$ LANGUAGE plpgsql;
