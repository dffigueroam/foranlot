-- Script para actualizar usernames a formato automático
-- Solo usuarios con username vacío o personalizado (no userXXXXXX)

DO $$
DECLARE
  rec RECORD;
  new_username TEXT;
BEGIN
  FOR rec IN SELECT id, username FROM users WHERE username IS NULL OR username !~ '^user[0-9]{6}$' LOOP
    new_username := 'user' || to_char(trunc(random()*900000 + 100000), 'FM999999');
    -- Verificar que no exista
    WHILE EXISTS (SELECT 1 FROM users WHERE username = new_username) LOOP
      new_username := 'user' || to_char(trunc(random()*900000 + 100000), 'FM999999');
    END LOOP;
    UPDATE users SET username = new_username WHERE id = rec.id;
  END LOOP;
END $$;
-- Fin del script
