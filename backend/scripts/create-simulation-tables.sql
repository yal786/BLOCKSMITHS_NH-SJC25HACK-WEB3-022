-- Create simulations and audit_logs tables for Re-simulate feature
-- Run this in your PostgreSQL database

-- Create simulations table
CREATE TABLE IF NOT EXISTS simulations (
  id SERIAL PRIMARY KEY,
  alert_tx_hash TEXT,
  simulation_id TEXT,
  estimated_loss_usd NUMERIC,
  attacker_profit_usd NUMERIC,
  slippage_percent NUMERIC,
  scenario_trace JSONB,
  sim_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  related_tx_hash TEXT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_simulations_alert_tx_hash ON simulations(alert_tx_hash);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_related_tx_hash ON audit_logs(related_tx_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Verify tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('simulations', 'audit_logs')
ORDER BY table_name, ordinal_position;

-- Show sample query
SELECT 
  COUNT(*) as total_simulations,
  AVG(estimated_loss_usd) as avg_loss,
  AVG(attacker_profit_usd) as avg_profit,
  AVG(slippage_percent) as avg_slippage
FROM simulations;
