-- Setup script for simulation-related database columns
-- Run this to ensure alerts table has all necessary columns

-- Add simulation status column
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS sim_status VARCHAR(20) DEFAULT 'pending';

-- Add simulation URL column (link to Tenderly dashboard)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS sim_url TEXT;

-- Add raw simulation data column
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS raw_sim JSONB;

-- Create index for faster queries on simulation status
CREATE INDEX IF NOT EXISTS idx_alerts_sim_status ON alerts(sim_status);

-- Create index for faster queries on risk level
CREATE INDEX IF NOT EXISTS idx_alerts_risk_level ON alerts(risk_level);

-- Create index for faster queries on transaction hash
CREATE INDEX IF NOT EXISTS idx_alerts_tx_hash ON alerts(tx_hash);

-- Verify columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'alerts'
  AND column_name IN ('sim_status', 'sim_url', 'raw_sim', 'slippage_pct', 'est_loss_usd')
ORDER BY ordinal_position;

-- Show sample data
SELECT tx_hash, risk_level, slippage_pct, est_loss_usd, sim_status, sim_url
FROM alerts
LIMIT 5;

-- Count alerts by simulation status
SELECT sim_status, COUNT(*) as count
FROM alerts
GROUP BY sim_status;
