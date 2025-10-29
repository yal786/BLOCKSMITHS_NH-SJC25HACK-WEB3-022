// backend/routes/simulateRoute.js
// API route for transaction simulation
import express from 'express';
import { simulateTenderlyTx } from '../sim/simulateTx.js';
import { parseTenderlySimulation } from '../sim/analyzeSimulation.js';
import { computeSlippageAndLoss } from '../sim/metrics.js';
import { updateAlertSimulation } from '../utils/alerts.js';

const router = express.Router();

/**
 * POST /api/simulate
 * Simulate a transaction and optionally update alert in database
 * 
 * Body:
 * {
 *   tx: { from, to, data, value, gas, gasPrice, networkId },
 *   txHash: "0x...",  // optional, for updating alert
 *   victimAddress: "0x...",
 *   tokenAddress: "0x...",
 *   baselineTokenOutWei: "1000000000000000000",
 *   tokenDecimals: 18,
 *   tokenUsdPrice: 1.0
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      tx,
      txHash,
      victimAddress,
      tokenAddress,
      baselineTokenOutWei,
      tokenDecimals = 18,
      tokenUsdPrice = 1.0
    } = req.body;

    // Validate required fields
    if (!tx || !tx.from || !tx.to) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required transaction fields (from, to)'
      });
    }

    // Run simulation
    console.log('🔬 Running Tenderly simulation for transaction:', txHash || 'preview');
    const simRes = await simulateTenderlyTx(tx);

    if (!simRes.success) {
      console.error('❌ Simulation failed:', simRes.error);
      
      // If txHash provided, mark as failed in DB
      if (txHash) {
        await updateAlertSimulation(txHash, {
          simStatus: 'failed',
          simRaw: { error: simRes.error, details: simRes.details }
        });
      }

      return res.status(500).json({
        ok: false,
        error: simRes.error,
        details: simRes.details
      });
    }

    // Parse simulation results
    const parsed = parseTenderlySimulation(simRes, {
      victimAddressLower: victimAddress?.toLowerCase(),
      tokenAddressLower: tokenAddress?.toLowerCase()
    });

    let slippagePct = null;
    let estLossUsd = null;

    // Calculate metrics if we have baseline data
    if (parsed.tokenOut && baselineTokenOutWei && tokenDecimals && tokenUsdPrice) {
      const metrics = computeSlippageAndLoss(
        baselineTokenOutWei,
        parsed.tokenOut,
        tokenDecimals,
        tokenUsdPrice
      );
      slippagePct = metrics.slippagePct;
      estLossUsd = metrics.estLossUsd;
      
      console.log(`📊 Simulation metrics: Slippage: ${slippagePct.toFixed(2)}%, Loss: $${estLossUsd.toFixed(2)}`);
    }

    // Update alert in database if txHash provided
    if (txHash) {
      await updateAlertSimulation(txHash, {
        slippagePct,
        estLossUsd,
        simUrl: parsed.explorerUrl,
        simRaw: parsed.raw,
        simStatus: 'done'
      });
      console.log(`✅ Updated alert ${txHash} with simulation results`);
    }

    // Return results
    res.json({
      ok: true,
      slippagePct,
      estLossUsd,
      explorerUrl: parsed.explorerUrl,
      tokenOut: parsed.tokenOut,
      transfers: parsed.transfers,
      gasUsed: parsed.gasUsed,
      status: parsed.status
    });

  } catch (err) {
    console.error('❌ Simulation error:', err);
    res.status(500).json({
      ok: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/**
 * POST /api/simulate/batch
 * Simulate multiple transactions (for sandwich attack analysis)
 */
router.post('/batch', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'transactions must be a non-empty array'
      });
    }

    const results = [];
    
    for (const txData of transactions) {
      const simRes = await simulateTenderlyTx(txData.tx);
      const parsed = parseTenderlySimulation(simRes, {
        victimAddressLower: txData.victimAddress?.toLowerCase(),
        tokenAddressLower: txData.tokenAddress?.toLowerCase()
      });
      
      results.push({
        txHash: txData.txHash,
        success: simRes.success,
        tokenOut: parsed.tokenOut,
        explorerUrl: parsed.explorerUrl
      });
    }

    res.json({
      ok: true,
      results
    });

  } catch (err) {
    console.error('❌ Batch simulation error:', err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

/**
 * GET /api/simulate/status/:txHash
 * Check simulation status for a specific transaction
 */
router.get('/status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const { pool } = await import('../utils/db.js');
    
    const result = await pool.query(
      'SELECT tx_hash, sim_status, slippage_pct, est_loss_usd, sim_url FROM alerts WHERE tx_hash = $1',
      [txHash]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      ok: true,
      ...result.rows[0]
    });

  } catch (err) {
    console.error('❌ Status check error:', err);
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

export default router;
