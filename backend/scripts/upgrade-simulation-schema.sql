-- Upgrade script for enhanced simulation features
-- Run this to add new columns for attacker profit and trace URLs

-- Add attacker profit column
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS attacker_profit_usd NUMERIC DEFAULT 0;

-- Add simulation mode column (quick/deep)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS sim_mode VARCHAR(20) DEFAULT 'quick';

-- Add trace URL column (for Tenderly deep traces)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS trace_url TEXT;

-- Add net attacker profit column (profit - gas cost)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS net_attacker_profit NUMERIC DEFAULT 0;

-- Add risk label column (safe/low/medium/high/critical)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS risk_label VARCHAR(20);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_alerts_sim_mode ON alerts(sim_mode);
CREATE INDEX IF NOT EXISTS idx_alerts_risk_label ON alerts(risk_label);
CREATE INDEX IF NOT EXISTS idx_alerts_attacker_profit ON alerts(attacker_profit_usd) WHERE attacker_profit_usd > 0;

-- Update existing rows to have default values
UPDATE alerts 
SET 
  attacker_profit_usd = COALESCE(attacker_profit_usd, 0),
  sim_mode = COALESCE(sim_mode, 'quick'),
  net_attacker_profit = COALESCE(net_attacker_profit, 0)
WHERE sim_status IS NOT NULL;

-- Verify new columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'alerts'
  AND column_name IN ('attacker_profit_usd', 'sim_mode', 'trace_url', 'net_attacker_profit', 'risk_label')
ORDER BY ordinal_position;

-- Show sample data with new fields
SELECT 
  tx_hash,
  risk_level,
  slippage_pct,
  est_loss_usd,
  attacker_profit_usd,
  net_attacker_profit,
  risk_label,
  sim_status,
  sim_mode,
  sim_url,
  trace_url
FROM alerts
WHERE sim_status = 'done'
LIMIT 5;

-- Summary statistics
SELECT 
  sim_status,
  sim_mode,
  risk_label,
  COUNT(*) as count,
  AVG(slippage_pct) as avg_slippage,
  AVG(est_loss_usd) as avg_loss,
  AVG(attacker_profit_usd) as avg_attacker_profit
FROM alerts
WHERE sim_status IS NOT NULL
GROUP BY sim_status, sim_mode, risk_label
ORDER BY count DESC;

COMMIT;
