-- Add subscription_expires_at column to users table
ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP;
-- Optionally, set default value if needed
-- ALTER TABLE users ALTER COLUMN subscription_expires_at SET DEFAULT NULL;
