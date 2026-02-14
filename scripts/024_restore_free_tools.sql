-- Restaurar herramientas gratuitas que se perdieron después de crear la zona premium
-- Esto asegura que usuarios NO PREMIUM tengan acceso a herramientas básicas

-- 1. Actualizar herramientas existentes para marcarlas como gratuitas
UPDATE prediction_tools 
SET is_premium = FALSE, credits_cost = 0
WHERE name IN (
  'Análisis de Frecuencia',
  'Números Calientes y Fríos',
  'Análisis de Distribución'
);

-- 2. Si no existen, insertar herramientas gratuitas básicas
INSERT INTO prediction_tools (name, description, tool_type, category, is_premium, credits_cost) 
VALUES
  (
    'Análisis de Frecuencia',
    'Analiza qué números han salido más frecuentemente en el historial de últimos 15 sorteos',
    'statistical',
    'frequency',
    FALSE,
    0
  ),
  (
    'Números Calientes y Fríos',
    'Identifica números que están "calientes" (salen mucho) o "fríos" (no salen hace tiempo)',
    'statistical',
    'hot_cold',
    FALSE,
    0
  ),
  (
    'Análisis de Distribución',
    'Analiza la distribución estadística de los resultados para entender patrones básicos',
    'statistical',
    'distribution',
    FALSE,
    0
  ),
  (
    'Validador de Números',
    'Valida combinaciones de números y muestra estadísticas rápidas de coincidencias',
    'analysis',
    'validation',
    FALSE,
    0
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Mantener herramientas premium para usuarios con suscripción
UPDATE prediction_tools 
SET is_premium = TRUE, credits_cost = 2
WHERE name = 'Análisis de Patrones'
AND is_premium = FALSE;

UPDATE prediction_tools 
SET is_premium = TRUE, credits_cost = 3
WHERE name = 'Predicción por Tendencia'
AND is_premium = FALSE;

UPDATE prediction_tools 
SET is_premium = TRUE, credits_cost = 2
WHERE name = 'Análisis de Pares y Tríos'
AND is_premium = FALSE;

UPDATE prediction_tools 
SET is_premium = TRUE, credits_cost = 5
WHERE name = 'Predicción por Machine Learning'
AND is_premium = FALSE;

UPDATE prediction_tools 
SET is_premium = TRUE, credits_cost = 1
WHERE name = 'Generador de Números Aleatorios Inteligente'
AND is_premium = FALSE;

-- 4. Verificar que hay al menos 3 herramientas gratuitas para el sistema diario
-- Esto se usa en assign_daily_free_tool() para asignar una herramienta gratis del día
DO $$
DECLARE
  free_tool_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO free_tool_count FROM prediction_tools WHERE is_premium = FALSE;
  
  IF free_tool_count < 2 THEN
    RAISE NOTICE 'ALERTA: Hay menos de 2 herramientas gratuitas. El sistema de herramienta gratis del día puede no funcionar correctamente.';
  ELSE
    RAISE NOTICE 'OK: Hay % herramientas gratuitas disponibles', free_tool_count;
  END IF;
END $$;

-- 5. Log de cambios
INSERT INTO audit_log (action, description, affected_table, created_at)
VALUES (
  'RESTORE_FREE_TOOLS',
  'Se restauraron herramientas gratuitas básicas para usuarios no premium',
  'prediction_tools',
  CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;
