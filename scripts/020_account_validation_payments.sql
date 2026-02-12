-- Add account validation fields to manual_payment_requests
ALTER TABLE manual_payment_requests 
ADD COLUMN IF NOT EXISTS account_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_validated_at TIMESTAMP;

-- Add index for searches
CREATE INDEX IF NOT EXISTS idx_manual_payments_validated ON manual_payment_requests(account_validated);

-- Update table column comments
COMMENT ON COLUMN manual_payment_requests.account_validated IS 'Indicates if user validated that the account is theirs';
COMMENT ON COLUMN manual_payment_requests.account_validated_at IS 'Timestamp of when the account was validated';
