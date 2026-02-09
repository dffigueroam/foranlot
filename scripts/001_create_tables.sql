-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pronósticos
CREATE TABLE IF NOT EXISTS predictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lottery_type VARCHAR(10) NOT NULL, -- '2_digits', '3_digits', '4_digits'
  predicted_number VARCHAR(4) NOT NULL,
  draw_date DATE NOT NULL,
  draw_time VARCHAR(20), -- 'morning', 'afternoon', 'night'
  is_verified BOOLEAN DEFAULT FALSE,
  is_correct BOOLEAN DEFAULT NULL,
  actual_number VARCHAR(4),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de membresías
CREATE TABLE IF NOT EXISTS memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ganancias para usuarios que postean
CREATE TABLE IF NOT EXISTS earnings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'prediction_view', 'subscription_share'
  related_prediction_id INTEGER REFERENCES predictions(id),
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  stripe_transfer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

-- Tabla de ranking (pre-calculado para performance)
CREATE TABLE IF NOT EXISTS user_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  rank_position INTEGER,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de resultados oficiales de loterías
CREATE TABLE IF NOT EXISTS lottery_results (
  id SERIAL PRIMARY KEY,
  lottery_type VARCHAR(10) NOT NULL,
  winning_number VARCHAR(4) NOT NULL,
  draw_date DATE NOT NULL,
  draw_time VARCHAR(20),
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lottery_type, draw_date, draw_time)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_draw_date ON predictions(draw_date);
CREATE INDEX IF NOT EXISTS idx_predictions_is_correct ON predictions(is_correct);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_user_id ON earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_lottery_results_date ON lottery_results(draw_date);
CREATE INDEX IF NOT EXISTS idx_user_stats_rank ON user_stats(rank_position);
