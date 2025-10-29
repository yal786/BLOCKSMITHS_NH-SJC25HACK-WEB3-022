// backend/routes/dashboardMetrics.js
import express from "express";
import { pool } from "../utils/db.js";

const router = express.Router();

// GET /api/dashboard-metrics
// Returns aggregated analytics data for dashboard charts
// Supports optional filtering by txHash query parameter
router.get("/", async (req, res) => {
  try {
    const { txHash } = req.query;
    const filterCondition = txHash ? `AND tx_hash = $1` : '';
    const filterParams = txHash ? [txHash] : [];
    
    console.log(txHash ? `📊 Fetching metrics for tx: ${txHash}` : "📊 Fetching dashboard metrics...");

    // 1. Transactions over time (last 60 minutes, grouped by minute)
    const txsOverTimeQuery = `
      SELECT 
        TO_CHAR(timestamp, 'HH24:MI') as time,
        COUNT(*) as count
      FROM events_log
      WHERE timestamp >= NOW() - INTERVAL '60 minutes' ${filterCondition}
      GROUP BY TO_CHAR(timestamp, 'HH24:MI')
      ORDER BY time ASC
      LIMIT 60;
    `;
    const txsOverTimeResult = txHash 
      ? await pool.query(txsOverTimeQuery, filterParams)
      : await pool.query(txsOverTimeQuery);
    const txsOverTime = txsOverTimeResult.rows.map(row => ({
      time: row.time,
      count: parseInt(row.count)
    }));

    // 2. Risk level distribution
    const riskLevelsQuery = `
      SELECT 
        COALESCE(risk_level, 'unknown') as level,
        COUNT(*) as count
      FROM events_log
      WHERE 1=1 ${filterCondition}
      GROUP BY risk_level;
    `;
    const riskLevelsResult = txHash
      ? await pool.query(riskLevelsQuery, filterParams)
      : await pool.query(riskLevelsQuery);
    const riskLevels = {
      low: 0,
      medium: 0,
      high: 0,
      unknown: 0
    };
    riskLevelsResult.rows.forEach(row => {
      const level = (row.level || 'unknown').toLowerCase();
      riskLevels[level] = parseInt(row.count);
    });

    // 3. Execution status distribution
    const executionStatusQuery = `
      SELECT 
        COALESCE(status, 'unknown') as status,
        COUNT(*) as count
      FROM events_log
      WHERE 1=1 ${filterCondition}
      GROUP BY status;
    `;
    const executionStatusResult = txHash
      ? await pool.query(executionStatusQuery, filterParams)
      : await pool.query(executionStatusQuery);
    const executionStatus = {
      success: 0,
      reverted: 0,
      failed: 0,
      unknown: 0
    };
    executionStatusResult.rows.forEach(row => {
      const status = (row.status || 'unknown').toLowerCase();
      executionStatus[status] = parseInt(row.count);
    });

    // 4. Loss and profit trend over time (last 60 minutes)
    const lossTrendQuery = `
      SELECT 
        TO_CHAR(timestamp, 'HH24:MI') as time,
        AVG(loss_usd) as loss,
        AVG(profit_usd) as profit,
        AVG(slippage) as slippage
      FROM events_log
      WHERE timestamp >= NOW() - INTERVAL '60 minutes' ${filterCondition}
      GROUP BY TO_CHAR(timestamp, 'HH24:MI')
      ORDER BY time ASC
      LIMIT 60;
    `;
    const lossTrendResult = txHash
      ? await pool.query(lossTrendQuery, filterParams)
      : await pool.query(lossTrendQuery);
    const lossTrend = lossTrendResult.rows.map(row => ({
      time: row.time,
      loss: parseFloat(row.loss || 0).toFixed(2),
      profit: parseFloat(row.profit || 0).toFixed(2),
      slippage: parseFloat(row.slippage || 0).toFixed(2)
    }));

    // 5. Protection success rate
    const protectionRateQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM events_log
      WHERE event_type = 'protection' ${filterCondition.replace('AND', 'AND')}
      GROUP BY status;
    `;
    const protectionRateResult = txHash
      ? await pool.query(protectionRateQuery, filterParams)
      : await pool.query(protectionRateQuery);
    const protectionRate = {
      protected: 0,
      failed: 0
    };
    protectionRateResult.rows.forEach(row => {
      if (row.status === 'success') {
        protectionRate.protected = parseInt(row.count);
      } else {
        protectionRate.failed = parseInt(row.count);
      }
    });

    // 6. Additional metrics: Total stats
    const totalStatsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'simulation' THEN 1 END) as total_simulations,
        COUNT(CASE WHEN event_type = 'protection' THEN 1 END) as total_protections,
        SUM(loss_usd) as total_loss,
        SUM(profit_usd) as total_profit,
        AVG(gas_used) as avg_gas
      FROM events_log
      WHERE 1=1 ${filterCondition};
    `;
    const totalStatsResult = txHash
      ? await pool.query(totalStatsQuery, filterParams)
      : await pool.query(totalStatsQuery);
    const stats = totalStatsResult.rows[0] || {};
    const totalStats = {
      totalEvents: parseInt(stats.total_events || 0),
      totalSimulations: parseInt(stats.total_simulations || 0),
      totalProtections: parseInt(stats.total_protections || 0),
      totalLoss: parseFloat(stats.total_loss || 0).toFixed(2),
      totalProfit: parseFloat(stats.total_profit || 0).toFixed(2),
      avgGas: parseInt(stats.avg_gas || 0)
    };

    // 7. Event type distribution for pie chart
    const eventTypeQuery = `
      SELECT 
        event_type,
        COUNT(*) as count
      FROM events_log
      WHERE 1=1 ${filterCondition}
      GROUP BY event_type;
    `;
    const eventTypeResult = txHash
      ? await pool.query(eventTypeQuery, filterParams)
      : await pool.query(eventTypeQuery);
    const eventTypes = {
      simulation: 0,
      protection: 0
    };
    eventTypeResult.rows.forEach(row => {
      eventTypes[row.event_type] = parseInt(row.count);
    });

    console.log("✅ Dashboard metrics fetched successfully");

    res.json({
      ok: true,
      txsOverTime,
      riskLevels,
      executionStatus,
      lossTrend,
      protectionRate,
      totalStats,
      eventTypes
    });

  } catch (error) {
    console.error("❌ Dashboard metrics error:", error.message);
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      // Return empty data structure so frontend doesn't break
      txsOverTime: [],
      riskLevels: { low: 0, medium: 0, high: 0 },
      executionStatus: { success: 0, reverted: 0, failed: 0 },
      lossTrend: [],
      protectionRate: { protected: 0, failed: 0 },
      totalStats: {
        totalEvents: 0,
        totalSimulations: 0,
        totalProtections: 0,
        totalLoss: "0.00",
        totalProfit: "0.00",
        avgGas: 0
      },
      eventTypes: { simulation: 0, protection: 0 }
    });
  }
});

export default router;
