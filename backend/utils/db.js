// backend/utils/db.js
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function insertAlert({
  txHash, from, to, riskLevel, confidence, rules, estLossUsd, slippagePct, payload
}) {
  const q = `
    INSERT INTO alerts
      (tx_hash, "from", "to", risk_level, confidence, rules, est_loss_usd, slippage_pct, payload)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (tx_hash) DO NOTHING
    RETURNING *;
  `;
  const values = [
    txHash,
    from || null,
    to || null,
    riskLevel || null,
    confidence || 0,
    rules ? JSON.stringify(rules) : JSON.stringify([]),
    estLossUsd || 0,
    slippagePct || 0,
    payload || {}
  ];
  const res = await pool.query(q, values);
  return res.rows[0];
}

// Insert event into events_log for dashboard analytics
export async function logEvent({
  txHash,
  eventType, // 'simulation' or 'protection'
  status, // 'success', 'reverted', 'failed'
  riskLevel, // 'low', 'medium', 'high'
  gasUsed,
  lossUsd,
  profitUsd,
  slippage
}) {
  try {
    const q = `
      INSERT INTO events_log
        (tx_hash, event_type, status, risk_level, gas_used, loss_usd, profit_usd, slippage, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (tx_hash, event_type) DO NOTHING
      RETURNING *;
    `;
    const values = [
      txHash || null,
      eventType || 'simulation',
      status || 'success',
      riskLevel ? riskLevel.toLowerCase() : 'medium',
      gasUsed || 0,
      lossUsd || 0,
      profitUsd || 0,
      slippage || 0
    ];
    const res = await pool.query(q, values);
    if (res.rows[0]) {
      console.log(`📊 Logged event: ${eventType} - ${status} (risk: ${riskLevel})`);
    } else {
      console.log(`📊 Duplicate event skipped: ${txHash} - ${eventType}`);
    }
    return res.rows[0];
  } catch (error) {
    console.error("❌ Failed to log event:", error.message);
    return null;
  }
}
