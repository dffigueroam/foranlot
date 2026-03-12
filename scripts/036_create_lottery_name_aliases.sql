-- Script 036: Tabla de alias para homogeneizar nombres de lotería en importaciones históricas

CREATE TABLE IF NOT EXISTS lottery_name_aliases (
  id BIGSERIAL PRIMARY KEY,
  alias_normalized VARCHAR(180) NOT NULL,
  canonical_lottery_name VARCHAR(180) NOT NULL,
  country VARCHAR(80),
  source VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lottery_name_aliases_scope
  ON lottery_name_aliases(alias_normalized, canonical_lottery_name, COALESCE(country, ''), COALESCE(source, ''));

CREATE INDEX IF NOT EXISTS idx_lottery_name_aliases_alias
  ON lottery_name_aliases(alias_normalized);

CREATE INDEX IF NOT EXISTS idx_lottery_name_aliases_country
  ON lottery_name_aliases(country);

CREATE INDEX IF NOT EXISTS idx_lottery_name_aliases_source
  ON lottery_name_aliases(source);

CREATE OR REPLACE FUNCTION update_lottery_name_aliases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'update_lottery_name_aliases_updated_at_trigger'
      AND c.relname = 'lottery_name_aliases'
  ) THEN
    EXECUTE 'DROP TRIGGER update_lottery_name_aliases_updated_at_trigger ON lottery_name_aliases';
  END IF;
END $$;

CREATE TRIGGER update_lottery_name_aliases_updated_at_trigger
BEFORE UPDATE ON lottery_name_aliases
FOR EACH ROW
EXECUTE FUNCTION update_lottery_name_aliases_updated_at();
