-- Agrega campos para control de inactividad y reactivación
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_post_date TIMESTAMP;
-- Fin del script
