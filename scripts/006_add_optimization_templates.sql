-- Plantillas de optimización para usuarios premium
CREATE TABLE IF NOT EXISTS optimization_templates (
  id SERIAL PRIMARY KEY,
  premium_user_id INTEGER NOT NULL REFERENCES users(id),
  free_user_id INTEGER NOT NULL REFERENCES users(id),
  template_name VARCHAR(64) NOT NULL,
  algorithm VARCHAR(64) NOT NULL,
  params JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_optimization_templates_premium_user_id ON optimization_templates(premium_user_id);
