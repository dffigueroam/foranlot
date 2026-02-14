-- Crear tabla de notificaciones del sistema
-- Almacena notificaciones importantes para los usuarios (cambios de avatar, cambios de sistema, etc.)

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error', 'avatar-change'
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_data JSONB, -- Para datos relacionados (ej: avatar info, créditos, etc)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para notification updates
DROP TRIGGER IF EXISTS update_notifications_updated_at_trigger ON notifications;
CREATE TRIGGER update_notifications_updated_at_trigger
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- Verificar estructura
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position;
