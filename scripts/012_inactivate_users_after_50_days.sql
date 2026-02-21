-- Inactiva usuarios que no han publicado en 50 días
UPDATE users
SET user_status = 'inactive'
WHERE (last_post_date IS NULL OR last_post_date < NOW() - INTERVAL '50 days')
  AND user_status = 'active';
-- Fin del script
