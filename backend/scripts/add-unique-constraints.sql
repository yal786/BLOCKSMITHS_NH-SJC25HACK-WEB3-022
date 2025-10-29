-- Add unique constraint to tx_hash in alerts table
-- This ensures each transaction hash is only stored once

-- First, remove any duplicate entries (keep the earliest one)
DELETE FROM alerts a
USING alerts b
WHERE a.id > b.id AND a.tx_hash = b.tx_hash;

-- Add UNIQUE constraint on tx_hash
ALTER TABLE alerts ADD CONSTRAINT unique_tx_hash UNIQUE (tx_hash);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_alerts_tx_hash ON alerts(tx_hash);

-- Add unique constraint to tx_hash in events_log table
-- This ensures each transaction is only logged once per event type

-- First, remove any duplicate entries (keep the earliest one)
DELETE FROM events_log a
USING events_log b
WHERE a.id > b.id AND a.tx_hash = b.tx_hash AND a.event_type = b.event_type;

-- Add UNIQUE constraint on tx_hash + event_type combination
-- (same tx can have simulation AND protection events, but not duplicate simulations)
ALTER TABLE events_log ADD CONSTRAINT unique_tx_hash_event_type UNIQUE (tx_hash, event_type);

-- Create index on tx_hash if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_events_tx_hash ON events_log(tx_hash);

SELECT 'Unique constraints added successfully!' as message;
