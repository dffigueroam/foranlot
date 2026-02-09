-- Script para mejorar el formulario de registro de usuarios
-- Feature 30: Agregar campos de perfil (nombre, teléfono, ciudad, país, Google OAuth)

-- 1. Agregar nuevas columnas a tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_method VARCHAR(20) DEFAULT 'email'; -- 'email' o 'google'
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Tabla de sesiones OAuth (para NextAuth.js)
CREATE TABLE IF NOT EXISTS oauth_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'github', etc
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- 3. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_id ON oauth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_provider ON oauth_sessions(provider, provider_account_id);

-- 4. Tabla de ciudades y países (referencia)
CREATE TABLE IF NOT EXISTS countries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(2) UNIQUE NOT NULL, -- 'CO', 'ES', 'MX', etc
  name VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  country_id INTEGER REFERENCES countries(id),
  name VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(country_id, name)
);

-- 5. Insertar países principales
INSERT INTO countries (code, name, region) VALUES
  ('CO', 'Colombia', 'South America'),
  ('ES', 'España', 'Europe'),
  ('MX', 'México', 'North America'),
  ('AR', 'Argentina', 'South America'),
  ('CL', 'Chile', 'South America'),
  ('PE', 'Perú', 'South America'),
  ('VE', 'Venezuela', 'South America'),
  ('EC', 'Ecuador', 'South America'),
  ('US', 'Estados Unidos', 'North America'),
  ('CA', 'Canadá', 'North America'),
  ('BR', 'Brasil', 'South America')
ON CONFLICT (code) DO NOTHING;

-- 6. Insertar ciudades principales de Colombia
INSERT INTO cities (country_id, name, state_province) VALUES
  ((SELECT id FROM countries WHERE code = 'CO'), 'Bogotá', 'Cundinamarca'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Medellín', 'Antioquia'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Cali', 'Valle del Cauca'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Barranquilla', 'Atlántico'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Cartagena', 'Bolívar'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Santa Marta', 'Magdalena'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Bucaramanga', 'Santander'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Cúcuta', 'Norte de Santander'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Pereira', 'Risaralda'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Manizales', 'Caldas'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Armenia', 'Quindío'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Ibagué', 'Tolima'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Villavicencio', 'Meta'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Popayán', 'Cauca'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Pasto', 'Nariño'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Quibdó', 'Chocó'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Valledupar', 'Cesar'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Montería', 'Córdoba'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Tunja', 'Boyacá'),
  ((SELECT id FROM countries WHERE code = 'CO'), 'Yopal', 'Casanare')
ON CONFLICT (country_id, name) DO NOTHING;

-- 7. Insertar ciudades principales de España
INSERT INTO cities (country_id, name, state_province) VALUES
  ((SELECT id FROM countries WHERE code = 'ES'), 'Madrid', 'Madrid'),
  ((SELECT id FROM countries WHERE code = 'ES'), 'Barcelona', 'Cataluña'),
  ((SELECT id FROM countries WHERE code = 'ES'), 'Valencia', 'Comunidad Valenciana'),
  ((SELECT id FROM countries WHERE code = 'ES'), 'Sevilla', 'Andalucía'),
  ((SELECT id FROM countries WHERE code = 'ES'), 'Zaragoza', 'Aragón'),
  ((SELECT id FROM countries WHERE code = 'ES'), 'Málaga', 'Andalucía'),
  ((SELECT id FROM countries WHERE code = 'ES'), 'Bilbao', 'País Vasco'),
  ((SELECT id FROM countries WHERE code = 'ES'), 'Alicante', 'Comunidad Valenciana')
ON CONFLICT (country_id, name) DO NOTHING;

-- 8. Función para obtener información de país y ciudad
CREATE OR REPLACE FUNCTION get_user_location(p_user_id INTEGER)
RETURNS TABLE(
  user_id INTEGER,
  username VARCHAR,
  full_name VARCHAR,
  city VARCHAR,
  country VARCHAR,
  country_code VARCHAR
) AS $$
SELECT 
  u.id,
  u.username,
  u.full_name,
  u.city,
  u.country,
  c.code
FROM users u
LEFT JOIN countries c ON c.name = u.country
WHERE u.id = p_user_id;
$$ LANGUAGE SQL;

-- 9. Comentarios explicativos
COMMENT ON COLUMN users.full_name IS 'Nombre completo del usuario';
COMMENT ON COLUMN users.phone_number IS 'Número de teléfono (opcional)';
COMMENT ON COLUMN users.city IS 'Ciudad de residencia';
COMMENT ON COLUMN users.country IS 'País de residencia';
COMMENT ON COLUMN users.google_id IS 'ID de Google para OAuth (si usa Google Sign-In)';
COMMENT ON COLUMN users.registration_method IS 'Método de registro: email o google';
COMMENT ON COLUMN users.avatar_url IS 'URL del avatar del usuario (desde Google o cargado)';
COMMENT ON COLUMN users.bio IS 'Biografía corta del usuario';
COMMENT ON TABLE oauth_sessions IS 'Sesiones OAuth para login con redes sociales';
COMMENT ON TABLE countries IS 'Referencia de países disponibles';
COMMENT ON TABLE cities IS 'Referencia de ciudades por país';
