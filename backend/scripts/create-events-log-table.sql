-- Create events_log table for dashboard analytics
CREATE TABLE IF NOT EXISTS events_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  tx_hash TEXT,
  event_type TEXT NOT NULL, -- 'protection' or 'simulation'
  status TEXT, -- 'success' or 'reverted'
  risk_level TEXT, -- 'low', 'medium', 'high'
  gas_used INTEGER,
  loss_usd FLOAT DEFAULT 0,
  profit_usd FLOAT DEFAULT 0,
  slippage FLOAT DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events_log(event_type);
CREATE INDEX IF NOT EXISTS idx_events_risk ON events_log(risk_level);

-- Insert some sample data for testing
INSERT INTO events_log (timestamp, tx_hash, event_type, status, risk_level, gas_used, loss_usd, profit_usd, slippage) VALUES
  (NOW() - INTERVAL '10 minutes', '0xabc123', 'simulation', 'success', 'high', 35000, 12.5, 5.2, 1.8),
  (NOW() - INTERVAL '9 minutes', '0xdef456', 'simulation', 'success', 'medium', 28000, 8.3, 3.1, 0.9),
  (NOW() - INTERVAL '8 minutes', '0xghi789', 'protection', 'success', 'high', 42000, 15.7, 6.8, 2.3),
  (NOW() - INTERVAL '7 minutes', '0xjkl012', 'simulation', 'reverted', 'low', 21000, 0, 0, 0),
  (NOW() - INTERVAL '6 minutes', '0xmno345', 'simulation', 'success', 'medium', 31000, 9.2, 3.5, 1.1),
  (NOW() - INTERVAL '5 minutes', '0xpqr678', 'protection', 'success', 'high', 38000, 11.8, 4.9, 1.6),
  (NOW() - INTERVAL '4 minutes', '0xstu901', 'simulation', 'success', 'low', 25000, 5.4, 2.1, 0.5),
  (NOW() - INTERVAL '3 minutes', '0xvwx234', 'simulation', 'success', 'medium', 29000, 7.6, 2.8, 0.8),
  (NOW() - INTERVAL '2 minutes', '0xyz567', 'protection', 'failed', 'high', 0, 18.2, 7.5, 2.7),
  (NOW() - INTERVAL '1 minute', '0zabc890', 'simulation', 'success', 'high', 40000, 14.3, 6.2, 2.1);

SELECT 'events_log table created successfully!' as message;
