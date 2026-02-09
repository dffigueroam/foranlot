-- Insertar algunos usuarios de ejemplo (password: "demo123")
-- Hash bcrypt para "demo123": $2a$10$YQ8P7Y.Z8rqZJZzxZQ8P7u7Y8P7Y8P7Y8P7Y8P7Y8P7Y8P7Y8P7
INSERT INTO users (email, username, password_hash, is_premium) VALUES
('usuario1@example.com', 'PronosticadorPro', '$2a$10$YQ8P7Y.Z8rqZJZzxZQ8P7u7Y8P7Y8P7Y8P7Y8P7Y8P7Y8P7Y8P7', FALSE),
('usuario2@example.com', 'NumerosMagicos', '$2a$10$YQ8P7Y.Z8rqZJZzxZQ8P7u7Y8P7Y8P7Y8P7Y8P7Y8P7Y8P7Y8P7', TRUE),
('usuario3@example.com', 'ChanceGuru', '$2a$10$YQ8P7Y.Z8rqZJZzxZQ8P7u7Y8P7Y8P7Y8P7Y8P7Y8P7Y8P7Y8P7', FALSE)
ON CONFLICT (email) DO NOTHING;

-- Insertar algunos pronósticos de ejemplo
INSERT INTO predictions (user_id, lottery_type, predicted_number, draw_date, draw_time, is_verified, is_correct, actual_number, confidence_level, notes) VALUES
(1, '3_digits', '123', CURRENT_DATE, 'afternoon', TRUE, TRUE, '123', 5, 'Análisis de patrones históricos'),
(1, '4_digits', '5678', CURRENT_DATE - INTERVAL '1 day', 'morning', TRUE, FALSE, '5679', 3, 'Basado en tendencias'),
(2, '2_digits', '45', CURRENT_DATE, 'night', TRUE, TRUE, '45', 4, 'Patrón identificado'),
(2, '3_digits', '789', CURRENT_DATE - INTERVAL '2 days', 'afternoon', TRUE, TRUE, '789', 5, 'Alta confianza'),
(3, '4_digits', '1234', CURRENT_DATE, 'morning', FALSE, NULL, NULL, 4, 'Predicción pendiente')
ON CONFLICT DO NOTHING;

-- Inicializar estadísticas de usuarios
INSERT INTO user_stats (user_id, total_predictions, correct_predictions, accuracy_percentage)
SELECT 
  id,
  0,
  0,
  0
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Actualizar estadísticas con datos reales
UPDATE user_stats us
SET 
  total_predictions = (SELECT COUNT(*) FROM predictions WHERE user_id = us.user_id AND is_verified = TRUE),
  correct_predictions = (SELECT COUNT(*) FROM predictions WHERE user_id = us.user_id AND is_correct = TRUE),
  accuracy_percentage = CASE 
    WHEN (SELECT COUNT(*) FROM predictions WHERE user_id = us.user_id AND is_verified = TRUE) > 0 
    THEN (SELECT COUNT(*) FROM predictions WHERE user_id = us.user_id AND is_correct = TRUE)::DECIMAL / 
         (SELECT COUNT(*) FROM predictions WHERE user_id = us.user_id AND is_verified = TRUE) * 100
    ELSE 0 
  END,
  last_updated = CURRENT_TIMESTAMP;
