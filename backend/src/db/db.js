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
