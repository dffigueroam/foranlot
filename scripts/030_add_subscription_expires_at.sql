-- Script 030: Agrega columna subscription_expires_at a users
-- Fecha: 2026-02-19
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
