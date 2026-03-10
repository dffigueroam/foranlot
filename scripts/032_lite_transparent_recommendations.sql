-- Script 032: Transparencia para recomendaciones Premium en versión Lite (correo)
-- Objetivo:
-- 1) Auditar cada generación de números recomendados y su consumo de crédito
-- 2) Guardar contribuyentes por número para compensación futura
-- 3) Registrar estado de entrega por canal (in-app/email)
-- 4) Alinear esquema de notifications (compatibilidad entre notification_type y type)

-- =====================================================
-- A) Preferencias de notificación/transparencia por usuario
-- =====================================================
-- Compatibilidad mínima de columnas históricas en users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS registration_method VARCHAR(20) DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notify_recommendations_in_app BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_recommendations_email BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS recommendation_transparency_level VARCHAR(20) DEFAULT 'full';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_recommendation_transparency_level_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_recommendation_transparency_level_check
      CHECK (recommendation_transparency_level IN ('full', 'basic', 'off'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_lite_email
  ON users(registration_method, role, email_verified);

-- =====================================================
-- B) Compatibilidad de notifications
-- =====================================================
-- Nota: existen scripts históricos con columnas distintas:
-- - notification_type / read_at
-- - type / related_data / updated_at
-- Esta sección garantiza que ambos modelos convivan.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS related_data JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50);

UPDATE notifications
SET type = COALESCE(type, notification_type, 'info')
WHERE type IS NULL;

UPDATE notifications
SET notification_type = COALESCE(notification_type, type, 'info')
WHERE notification_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_notification_type ON notifications(notification_type);

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger ON notifications;
CREATE TRIGGER update_notifications_updated_at_trigger
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- =====================================================
-- C) Trazabilidad completa de recomendaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS premium_recommendation_runs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_channel VARCHAR(20) NOT NULL DEFAULT 'premium', -- premium | lite
  algorithm_version VARCHAR(30) NOT NULL DEFAULT 'v1',
  filters JSONB,
  credits_spent INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- completed | failed
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_recommendation_runs_user_date
  ON premium_recommendation_runs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_premium_recommendation_runs_status
  ON premium_recommendation_runs(status);

CREATE TABLE IF NOT EXISTS premium_recommendation_items (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES premium_recommendation_runs(id) ON DELETE CASCADE,
  lottery_name VARCHAR(120) NOT NULL,
  lottery_type VARCHAR(20) NOT NULL,
  ranking_position INTEGER NOT NULL,
  recommended_number VARCHAR(20) NOT NULL,
  score NUMERIC(12,4) NOT NULL,
  signals JSONB,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_recommendation_items_run
  ON premium_recommendation_items(run_id, lottery_name, ranking_position);

CREATE INDEX IF NOT EXISTS idx_premium_recommendation_items_lottery
  ON premium_recommendation_items(lottery_name, lottery_type, score DESC);

CREATE TABLE IF NOT EXISTS premium_recommendation_contributors (
  id BIGSERIAL PRIMARY KEY,
  recommendation_item_id BIGINT NOT NULL REFERENCES premium_recommendation_items(id) ON DELETE CASCADE,
  predictor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contribution_weight NUMERIC(12,6) NOT NULL,
  rank_in_item INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_recommendation_contributors_item
  ON premium_recommendation_contributors(recommendation_item_id, rank_in_item);

CREATE INDEX IF NOT EXISTS idx_premium_recommendation_contributors_predictor
  ON premium_recommendation_contributors(predictor_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS premium_recommendation_deliveries (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES premium_recommendation_runs(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL, -- in_app | email
  delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | delivered | failed | skipped
  recipient_email VARCHAR(255),
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_premium_recommendation_deliveries_run
  ON premium_recommendation_deliveries(run_id, channel);

-- =====================================================
-- D) Vistas de transparencia (Lite)
-- =====================================================
CREATE OR REPLACE VIEW lite_recommendation_audit AS
SELECT
  r.id AS run_id,
  r.user_id,
  u.username,
  u.email,
  u.role,
  u.registration_method,
  u.email_verified,
  r.source_channel,
  r.algorithm_version,
  r.credits_spent,
  r.status,
  r.error_message,
  r.created_at,
  COALESCE((
    SELECT COUNT(*)
    FROM premium_recommendation_items i
    WHERE i.run_id = r.id
  ), 0) AS total_items,
  COALESCE((
    SELECT COUNT(*)
    FROM premium_recommendation_deliveries d
    WHERE d.run_id = r.id
      AND d.channel = 'email'
      AND d.delivery_status = 'delivered'
  ), 0) AS email_delivered_count,
  COALESCE((
    SELECT COUNT(*)
    FROM premium_recommendation_deliveries d
    WHERE d.run_id = r.id
      AND d.channel = 'in_app'
      AND d.delivery_status = 'delivered'
  ), 0) AS in_app_delivered_count
FROM premium_recommendation_runs r
JOIN users u ON u.id = r.user_id
WHERE (u.role = 'user_email' OR u.registration_method = 'email');

CREATE OR REPLACE VIEW predictor_compensation_audit AS
SELECT
  c.predictor_user_id,
  u.username AS predictor_username,
  i.lottery_name,
  i.lottery_type,
  i.recommended_number,
  i.score,
  c.contribution_weight,
  c.rank_in_item,
  r.id AS run_id,
  r.created_at AS recommendation_created_at,
  r.status
FROM premium_recommendation_contributors c
JOIN premium_recommendation_items i ON i.id = c.recommendation_item_id
JOIN premium_recommendation_runs r ON r.id = i.run_id
JOIN users u ON u.id = c.predictor_user_id;
