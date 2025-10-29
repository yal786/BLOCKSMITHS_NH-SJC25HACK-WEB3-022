// backend/routes/mockDashboardMetrics.js
// Generates unique analytics data for each transaction hash
// Used when events_log doesn't have data for a specific transaction

import express from "express";
import crypto from "crypto";

const router = express.Router();

// Generate deterministic but varied data based on transaction hash
function hashToNumber(txHash, min, max) {
  const hash = crypto.createHash('md5').update(txHash).digest('hex');
  const num = parseInt(hash.substr(0, 8), 16);
  return min + (num % (max - min + 1));
}

function generateMockMetrics(txHash) {
  // Use transaction hash as seed for consistent but varied data
  const seed = txHash ? hashToNumber(txHash, 1, 1000) : 500;
  const riskFactor = seed % 3; // 0=low, 1=medium, 2=high
  const timeSeed = Date.now() % 60;

  // 1. Transactions over time (varied by hash)
  const txsOverTime = Array.from({ length: 12 }, (_, i) => {
    const hour = String(Math.floor(timeSeed / 5) + i).padStart(2, '0');
    const minute = String((timeSeed * (i + 1)) % 60).padStart(2, '0');
    return {
      time: `${hour}:${minute}`,
      count: hashToNumber(txHash + i, 1, 15)
    };
  });

  // 2. Risk levels (varied by transaction)
  const riskLevels = {
    low: riskFactor === 0 ? hashToNumber(txHash + 'low', 50, 100) : hashToNumber(txHash + 'low', 5, 20),
    medium: riskFactor === 1 ? hashToNumber(txHash + 'med', 40, 80) : hashToNumber(txHash + 'med', 10, 30),
    high: riskFactor === 2 ? hashToNumber(txHash + 'high', 30, 70) : hashToNumber(txHash + 'high', 5, 25),
    unknown: hashToNumber(txHash + 'unk', 0, 5)
  };

  // 3. Execution status (varied)
  const executionStatus = {
    success: hashToNumber(txHash + 'success', 60, 95),
    reverted: hashToNumber(txHash + 'reverted', 3, 20),
    failed: hashToNumber(txHash + 'failed', 2, 15),
    unknown: hashToNumber(txHash + 'unknown', 0, 5)
  };

  // 4. Loss/Profit trend
  const lossTrend = Array.from({ length: 12 }, (_, i) => {
    const hour = String(Math.floor(timeSeed / 5) + i).padStart(2, '0');
    const minute = String((timeSeed * (i + 1)) % 60).padStart(2, '0');
    return {
      time: `${hour}:${minute}`,
      loss: (hashToNumber(txHash + 'loss' + i, 100, 5000) / 100).toFixed(2),
      profit: (hashToNumber(txHash + 'profit' + i, 50, 3000) / 100).toFixed(2),
      slippage: (hashToNumber(txHash + 'slip' + i, 10, 150) / 10).toFixed(2)
    };
  });

  // 5. Protection rate
  const protectionRate = {
    protected: hashToNumber(txHash + 'prot', 40, 90),
    failed: hashToNumber(txHash + 'pfail', 5, 30)
  };

  // 6. Total stats
  const totalStats = {
    totalEvents: hashToNumber(txHash + 'events', 100, 500),
    totalSimulations: hashToNumber(txHash + 'sim', 50, 200),
    totalProtections: hashToNumber(txHash + 'prot', 30, 150),
    totalLoss: (hashToNumber(txHash + 'tloss', 1000, 50000) / 100).toFixed(2),
    totalProfit: (hashToNumber(txHash + 'tprof', 500, 30000) / 100).toFixed(2),
    avgGas: hashToNumber(txHash + 'gas', 50000, 250000)
  };

  // 7. Event types
  const eventTypes = {
    simulation: hashToNumber(txHash + 'esim', 60, 150),
    protection: hashToNumber(txHash + 'eprot', 30, 100)
  };

  return {
    ok: true,
    txsOverTime,
    riskLevels,
    executionStatus,
    lossTrend,
    protectionRate,
    totalStats,
    eventTypes,
    _mock: true,
    _txHash: txHash
  };
}

// GET /api/mock-dashboard-metrics
// Returns mock analytics data with variation based on txHash
router.get("/", async (req, res) => {
  try {
    const { txHash } = req.query;
    
    console.log(txHash 
      ? `📊 Generating mock metrics for tx: ${txHash.slice(0, 16)}...` 
      : "📊 Generating mock dashboard metrics (global)");

    const metrics = generateMockMetrics(txHash || 'global');

    res.json(metrics);

  } catch (error) {
    console.error("❌ Mock metrics error:", error.message);
    res.status(500).json({ 
      ok: false, 
      error: error.message
    });
  }
});

export default router;
