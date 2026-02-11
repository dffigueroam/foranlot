-- Script 019: Sistema de Verificación de Email
-- Fecha: 2026-02-10
-- Descripción: Agrega verificación de email y tokens de confirmación

-- 1. Agregar campos de verificación a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Crear índice para búsqueda rápida de tokens
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(email_verification_token);

-- 3. Crear tabla de registro de verificaciones de email
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Índices
  INDEX idx_email_verifications_user_id (user_id),
  INDEX idx_email_verifications_token (token),
  INDEX idx_email_verifications_expires (expires_at)
);

-- 4. Actualizar usuarios existentes como verificados (migración)
-- Los usuarios registrados antes de este sistema se consideran verificados automáticamente
UPDATE users 
SET 
  email_verified = TRUE,
  email_verified_at = created_at
WHERE email_verified = FALSE 
  AND created_at < CURRENT_TIMESTAMP;

-- 5. Crear función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_email_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar tokens expirados más antiguos de 7 días
  DELETE FROM email_verifications
  WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND verified_at IS NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Limpiar tokens de la tabla users también
  UPDATE users
  SET 
    email_verification_token = NULL,
    email_verification_expires = NULL
  WHERE email_verification_expires < CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND email_verified = FALSE;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Comentarios de documentación
COMMENT ON COLUMN users.email_verified IS 'Indica si el email del usuario ha sido verificado';
COMMENT ON COLUMN users.email_verification_token IS 'Token único para verificación de email (UUID)';
COMMENT ON COLUMN users.email_verification_expires IS 'Fecha de expiración del token de verificación';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp de cuándo se verificó el email';
COMMENT ON TABLE email_verifications IS 'Registro de todas las verificaciones de email enviadas';
COMMENT ON FUNCTION cleanup_expired_email_tokens IS 'Limpia tokens de verificación expirados (ejecutar diariamente)';

-- 7. Mensaje de confirmación
DO $$ 
BEGIN
  RAISE NOTICE 'Script 019 ejecutado exitosamente: Sistema de verificación de email creado';
END $$;
