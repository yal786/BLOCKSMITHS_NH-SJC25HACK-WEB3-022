// backend/utils/alerts.js
// Enhanced alert database helpers with simulation support
import { pool } from './db.js';

/**
 * Insert a new alert with optional simulation data
 */
export async function insertAlertWithSim({
  txHash,
  from,
  to,
  riskLevel,
  confidence,
  rules,
  estLossUsd,
  slippagePct,
  payload,
  simStatus = 'pending',
  simUrl = null,
  rawSim = null
}) {
  const q = `
    INSERT INTO alerts
      (tx_hash, "from", "to", risk_level, confidence, rules, est_loss_usd, 
       slippage_pct, payload, sim_status, sim_url, raw_sim)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (tx_hash) DO UPDATE SET
      sim_status = EXCLUDED.sim_status,
      sim_url = EXCLUDED.sim_url,
      raw_sim = EXCLUDED.raw_sim,
      slippage_pct = EXCLUDED.slippage_pct,
      est_loss_usd = EXCLUDED.est_loss_usd
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
    payload || {},
    simStatus,
    simUrl,
    rawSim ? JSON.stringify(rawSim) : null
  ];
  
  const res = await pool.query(q, values);
  return res.rows[0];
}

/**
 * Update alert with simulation results (enhanced)
 */
export async function updateAlertSimulation(txHash, {
  slippagePct = null,
  estLossUsd = null,
  attackerProfitUsd = null,
  netAttackerProfit = null,
  riskLabel = null,
  simUrl = null,
  traceUrl = null,
  simRaw = null,
  simStatus = 'done',
  simMode = 'quick'
}) {
  const q = `
    UPDATE alerts
    SET slippage_pct = COALESCE($1, slippage_pct),
        est_loss_usd = COALESCE($2, est_loss_usd),
        attacker_profit_usd = COALESCE($3, attacker_profit_usd),
        net_attacker_profit = COALESCE($4, net_attacker_profit),
        risk_label = COALESCE($5, risk_label),
        sim_url = COALESCE($6, sim_url),
        trace_url = COALESCE($7, trace_url),
        raw_sim = COALESCE($8, raw_sim),
        sim_status = $9,
        sim_mode = $10,
        created_at = created_at
    WHERE tx_hash = $11
    RETURNING *;
  `;
  
  const values = [
    slippagePct,
    estLossUsd,
    attackerProfitUsd,
    netAttackerProfit,
    riskLabel,
    simUrl,
    traceUrl,
    simRaw ? JSON.stringify(simRaw) : null,
    simStatus,
    simMode,
    txHash
  ];
  
  try {
    const res = await pool.query(q, values);
    return res.rows[0];
  } catch (error) {
    console.error('Error updating alert simulation:', error.message);
    throw error;
  }
}

/**
 * Mark simulation as failed
 */
export async function markSimulationFailed(txHash, errorMessage) {
  const q = `
    UPDATE alerts
    SET sim_status = 'failed',
        raw_sim = $1,
        created_at = created_at
    WHERE tx_hash = $2
    RETURNING *;
  `;
  
  const values = [
    JSON.stringify({ error: errorMessage, failedAt: new Date().toISOString() }),
    txHash
  ];
  
  const res = await pool.query(q, values);
  return res.rows[0];
}

/**
 * Get alerts pending simulation
 */
export async function getPendingSimulations(limit = 10) {
  const q = `
    SELECT * FROM alerts
    WHERE sim_status = 'pending'
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  
  const res = await pool.query(q, [limit]);
  return res.rows;
}

/**
 * Get all alerts with optional filters
 */
export async function getAlerts({
  limit = 100,
  offset = 0,
  riskLevel = null,
  minConfidence = null,
  simStatus = null
} = {}) {
  let q = `SELECT * FROM alerts WHERE 1=1`;
  const values = [];
  let paramCount = 0;

  if (riskLevel) {
    paramCount++;
    q += ` AND risk_level = $${paramCount}`;
    values.push(riskLevel);
  }

  if (minConfidence !== null) {
    paramCount++;
    q += ` AND confidence >= $${paramCount}`;
    values.push(minConfidence);
  }

  if (simStatus) {
    paramCount++;
    q += ` AND sim_status = $${paramCount}`;
    values.push(simStatus);
  }

  q += ` ORDER BY created_at DESC`;
  
  paramCount++;
  q += ` LIMIT $${paramCount}`;
  values.push(limit);
  
  paramCount++;
  q += ` OFFSET $${paramCount}`;
  values.push(offset);

  const res = await pool.query(q, values);
  return res.rows;
}
