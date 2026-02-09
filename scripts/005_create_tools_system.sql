-- Sistema de herramientas estadísticas y de predicción

-- Tabla de herramientas disponibles
CREATE TABLE IF NOT EXISTS prediction_tools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tool_type VARCHAR(50) NOT NULL, -- 'statistical', 'prediction', 'analysis'
  category VARCHAR(100), -- 'frequency', 'hot_cold', 'pattern', 'trend', etc.
  is_premium BOOLEAN DEFAULT FALSE,
  credits_cost INTEGER DEFAULT 0, -- Costo en créditos para usuarios premium
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de uso de herramientas por usuario
CREATE TABLE IF NOT EXISTS tool_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tool_id INTEGER REFERENCES prediction_tools(id) ON DELETE CASCADE,
  lottery_type VARCHAR(10) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_free_daily BOOLEAN DEFAULT FALSE,
  credits_used INTEGER DEFAULT 0,
  input_data JSONB, -- Datos que el usuario subió
  result_data JSONB, -- Resultados de la herramienta
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de datos históricos subidos por usuarios
CREATE TABLE IF NOT EXISTS user_uploaded_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lottery_type VARCHAR(10) NOT NULL,
  file_name VARCHAR(255),
  data JSONB NOT NULL, -- Array de números históricos con fechas
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_public BOOLEAN DEFAULT FALSE, -- Si otros usuarios pueden usar estos datos
  row_count INTEGER
);

-- Tabla de herramienta gratis diaria asignada
CREATE TABLE IF NOT EXISTS daily_free_tool (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tool_id INTEGER REFERENCES prediction_tools(id) ON DELETE CASCADE,
  lottery_type VARCHAR(10) NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  UNIQUE(user_id, assigned_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_date ON tool_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_user_uploaded_data_user ON user_uploaded_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploaded_data_lottery ON user_uploaded_data(lottery_type);
CREATE INDEX IF NOT EXISTS idx_daily_free_tool_user_date ON daily_free_tool(user_id, assigned_date);

-- Insertar herramientas predefinidas
INSERT INTO prediction_tools (name, description, tool_type, category, is_premium, credits_cost) VALUES
('Análisis de Frecuencia', 'Analiza qué números han salido más frecuentemente en el historial', 'statistical', 'frequency', FALSE, 0),
('Números Calientes y Fríos', 'Identifica números que están "calientes" (salen mucho) o "fríos" (no salen)', 'statistical', 'hot_cold', FALSE, 0),
('Análisis de Patrones', 'Detecta patrones y secuencias en los resultados históricos', 'analysis', 'pattern', TRUE, 2),
('Predicción por Tendencia', 'Predice números basándose en tendencias estadísticas', 'prediction', 'trend', TRUE, 3),
('Análisis de Pares y Tríos', 'Encuentra combinaciones de números que suelen salir juntos', 'analysis', 'combination', TRUE, 2),
('Predicción por Machine Learning', 'Usa algoritmos avanzados para predecir próximos números', 'prediction', 'ml', TRUE, 5),
('Análisis de Distribución', 'Analiza la distribución estadística de los resultados', 'statistical', 'distribution', FALSE, 0),
('Generador de Números Aleatorios Inteligente', 'Genera números aleatorios con pesos basados en estadísticas', 'prediction', 'random', TRUE, 1)
ON CONFLICT DO NOTHING;

-- Función para asignar herramienta gratis diaria aleatoria
CREATE OR REPLACE FUNCTION assign_daily_free_tool(p_user_id INTEGER)
RETURNS TABLE(tool_id INTEGER, tool_name VARCHAR, lottery_type VARCHAR) AS $$
DECLARE
  v_random_tool_id INTEGER;
  v_random_lottery VARCHAR(10);
  v_tool_name VARCHAR(255);
  v_lotteries TEXT[] := ARRAY['2_cifras', '3_cifras', '4_cifras'];
BEGIN
  -- Verificar si ya tiene herramienta asignada hoy
  IF EXISTS (
    SELECT 1 FROM daily_free_tool 
    WHERE user_id = p_user_id 
    AND assigned_date = CURRENT_DATE
  ) THEN
    -- Retornar la herramienta ya asignada
    RETURN QUERY
    SELECT dft.tool_id, pt.name, dft.lottery_type
    FROM daily_free_tool dft
    JOIN prediction_tools pt ON pt.id = dft.tool_id
    WHERE dft.user_id = p_user_id 
    AND dft.assigned_date = CURRENT_DATE;
    RETURN;
  END IF;
  
  -- Seleccionar una herramienta aleatoria
  SELECT id, name INTO v_random_tool_id, v_tool_name
  FROM prediction_tools
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- Seleccionar una lotería aleatoria
  v_random_lottery := v_lotteries[1 + floor(random() * array_length(v_lotteries, 1))];
  
  -- Insertar la asignación
  INSERT INTO daily_free_tool (user_id, tool_id, lottery_type, assigned_date)
  VALUES (p_user_id, v_random_tool_id, v_random_lottery, CURRENT_DATE);
  
  -- Crear notificación
  INSERT INTO notifications (user_id, notification_type, title, message)
  VALUES (
    p_user_id,
    'daily_free_tool',
    'Herramienta Gratis del Día',
    format('Hoy puedes usar gratis: %s para %s', v_tool_name, v_random_lottery)
  );
  
  -- Retornar la herramienta asignada
  RETURN QUERY
  SELECT v_random_tool_id, v_tool_name, v_random_lottery;
END;
$$ LANGUAGE plpgsql;
