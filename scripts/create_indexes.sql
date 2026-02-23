-- Index recommendations for scalable queries
CREATE INDEX IF NOT EXISTS idx_lotteries_country ON lotteries(country);
CREATE INDEX IF NOT EXISTS idx_lotteries_digits ON lotteries USING GIN(digits);
CREATE INDEX IF NOT EXISTS idx_lotteries_is_active ON lotteries(is_active);
-- Composite index for frequent filter
CREATE INDEX IF NOT EXISTS idx_lotteries_country_digits_active ON lotteries(country, is_active);
