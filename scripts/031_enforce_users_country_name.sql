-- Fuerza almacenamiento de nombre de pais (no codigo) en users.country
-- y valida contra la tabla countries.

-- 1) Normalizar registros existentes con codigos comunes/alias
UPDATE users u
SET country = c.name
FROM countries c
WHERE u.country IS NOT NULL
  AND (
    UPPER(TRIM(u.country)) = UPPER(c.code)
    OR LOWER(TRIM(u.country)) = LOWER(c.name)
    OR (UPPER(TRIM(u.country)) = 'COL' AND UPPER(c.code) = 'CO')
    OR (UPPER(TRIM(u.country)) = 'ESP' AND UPPER(c.code) = 'ES')
    OR (UPPER(TRIM(u.country)) = 'USA' AND UPPER(c.code) = 'US')
  );

-- 2) Trigger para normalizar y validar en INSERT/UPDATE
CREATE OR REPLACE FUNCTION normalize_and_validate_users_country()
RETURNS TRIGGER AS $$
DECLARE
  resolved_name TEXT;
  normalized_input TEXT;
BEGIN
  IF NEW.country IS NULL OR TRIM(NEW.country) = '' THEN
    NEW.country := NULL;
    RETURN NEW;
  END IF;

  normalized_input := TRIM(NEW.country);

  IF UPPER(normalized_input) = 'COL' THEN
    normalized_input := 'CO';
  ELSIF UPPER(normalized_input) = 'ESP' THEN
    normalized_input := 'ES';
  ELSIF UPPER(normalized_input) = 'USA' THEN
    normalized_input := 'US';
  END IF;

  SELECT c.name
  INTO resolved_name
  FROM countries c
  WHERE UPPER(c.code) = UPPER(normalized_input)
     OR LOWER(c.name) = LOWER(normalized_input)
  LIMIT 1;

  IF resolved_name IS NULL THEN
    RAISE EXCEPTION 'Pais invalido para users.country: %', NEW.country;
  END IF;

  NEW.country := resolved_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_country_normalize ON users;

CREATE TRIGGER trg_users_country_normalize
BEFORE INSERT OR UPDATE OF country ON users
FOR EACH ROW
EXECUTE FUNCTION normalize_and_validate_users_country();
