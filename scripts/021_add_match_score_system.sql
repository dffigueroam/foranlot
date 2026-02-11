-- Sistema de scores por combinaciones
-- 4 puntos para combinación de 4 cifras
-- 2 puntos para combinación de 3 cifras

ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS match_type VARCHAR(20) DEFAULT 'no_match',
ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0;

-- Tipos de coincidencia:
-- 'exact' - Coincidencia exacta (número igual)
-- 'combination' - Combinación/permutación de dígitos
-- 'no_match' - Sin coincidencia

COMMENT ON COLUMN predictions.match_type IS 'Tipo de coincidencia: exact, combination, no_match';
COMMENT ON COLUMN predictions.match_score IS 'Puntos: 4 para combinación 4 cifras, 2 para combinación 3 cifras';

-- Actualizar user_stats para incluir total_score
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;

COMMENT ON COLUMN user_stats.total_score IS 'Suma total de match_score de todas las predicciones verificadas';

-- Crear índice para mejorar performance en consultas de ranking
CREATE INDEX IF NOT EXISTS idx_predictions_match_score ON predictions(match_score) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_user_stats_total_score ON user_stats(total_score);
