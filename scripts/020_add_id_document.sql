-- Script 020: Campo de Documento de Identidad
-- Fecha: 2026-02-10
-- Descripción: Agrega campo para cédula/DNI/pasaporte para sistemas de pagos

-- 1. Agregar columna de documento de identidad
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document_country VARCHAR(2);

-- 2. Crear índice para búsqueda de documentos (prevenir duplicados)
CREATE INDEX IF NOT EXISTS idx_users_id_document ON users(id_document, id_document_country) 
WHERE id_document IS NOT NULL;

-- 3. Comentarios de documentación
COMMENT ON COLUMN users.id_document IS 'Número de cédula/DNI/pasaporte del usuario';
COMMENT ON COLUMN users.id_document_type IS 'Tipo: cedula, dni, passport, etc.';
COMMENT ON COLUMN users.id_document_country IS 'País emisor del documento (código ISO)';

-- 4. Mensaje de confirmación
DO $$ 
BEGIN
  RAISE NOTICE 'Script 020 ejecutado exitosamente: Campo de documento de identidad agregado';
END $$;
