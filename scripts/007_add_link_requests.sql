-- Tabla para solicitudes de vinculación de cuentas
CREATE TABLE link_requests (
  id SERIAL PRIMARY KEY,
  premium_user_id INTEGER NOT NULL REFERENCES users(id),
  free_user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(16) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobada', 'rechazada'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas rápidas
CREATE INDEX idx_link_requests_free_user ON link_requests(free_user_id);
CREATE INDEX idx_link_requests_premium_user ON link_requests(premium_user_id);
