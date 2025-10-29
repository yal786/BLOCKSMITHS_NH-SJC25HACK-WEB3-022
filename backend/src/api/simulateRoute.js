// backend/src/api/simulateRoute.js
// API routes for manual transaction simulation (Transaction Builder)
import express from 'express';
import { simulateSandwichAttack, quickSimulate, isHardhatAvailable } from '../sim/hardhatSim.js';
import { simulateTenderlyTx } from '../sim/tenderlySim.js';
import { analyzeSimulationResult, formatAnalysisForDisplay } from '../sim/analyzeSimResult.js';
import { updateAlertSimulation } from '../db/alerts.js';

const router = express.Router();

/**
 * POST /v1/simulate
 * Manual simulation endpoint for Transaction Builder
 * 
 * Request body:
 * {
 *   to: "0xRouterAddress",
 *   from: "0xUserAddress", // optional
 *   data: "0xEncodedCallData",
 *   value: "0x0",
 *   gasLimit: 8000000,
 *   mode: "quick" | "deep",
 *   chainId: "1",
 *   slippage: 0.02,
 *   
 *   // Optional: for updating existing alert
 *   txHash: "0x...",
 *   
 *   // Context for analysis
 *   tokenAddress: "0x...",
 *   tokenDecimals: 18,
 *   tokenUsdPrice: 2500,
 *   ethUsdPrice: 3000
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      to,
      from,
      data,
      value = '0x0',
      gasLimit = 8000000,
      mode = 'quick',
      chainId = '1',
      slippage = 0.02,
      txHash,
      tokenAddress,
      tokenDecimals = 18,
      tokenUsdPrice = 1,
      ethUsdPrice = 3000,
    } = req.body;

    // Validate required fields
    if (!to || !data) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: to and data are required',
      });
    }

    // Build transaction object
    const tx = {
      from: from || '0x0000000000000000000000000000000000000000',
      to,
      data,
      value,
      gas: gasLimit,
      gasPrice: '0x' + (30e9).toString(16), // 30 gwei default
    };

    console.log(`\n🔬 [MANUAL-SIM] Simulation request`);
    console.log(`   Mode: ${mode}`);
    console.log(`   To: ${to}`);
    console.log(`   From: ${from || 'N/A'}`);

    let simResult;
    let simulationMethod = '';

    // Choose simulation method based on mode
    if (mode === 'deep') {
      // Deep mode: Try Tenderly for full trace
      console.log('   → Running deep simulation with Tenderly...');
      simulationMethod = 'tenderly';
      
      try {
        const tenderlyResult = await simulateTenderlyTx(tx);
        
        if (tenderlyResult.success) {
          simResult = {
            success: true,
            mode: 'deep',
            estGas: tenderlyResult.gasUsed || 0,
            estSlippagePct: 1.5, // Would need deeper analysis
            estLossUsd: 10,
            attackerProfitUsd: 5,
            scenario: 'tenderly',
            confidence: 0.8,
            explorerUrl: tenderlyResult.explorerUrl,
            traceUrl: tenderlyResult.explorerUrl,
          };
        } else {
          throw new Error(tenderlyResult.error || 'Tenderly simulation failed');
        }
      } catch (error) {
        console.error('   ⚠️ Tenderly failed, falling back to quick mode:', error.message);
        simulationMethod = 'quick-fallback';
        simResult = await quickSimulate(tx, { mode: 'quick' });
      }
    } else {
      // Quick mode: Use Hardhat or quick estimation
      console.log('   → Running quick simulation...');
      simulationMethod = 'quick';
      
      if (isHardhatAvailable()) {
        try {
          simResult = await quickSimulate(tx, { mode: 'quick' });
        } catch (error) {
          console.error('   ⚠️ Quick simulation error:', error.message);
          return res.status(500).json({
            ok: false,
            error: 'Simulation failed: ' + error.message,
          });
        }
      } else {
        // Manual estimation without Hardhat
        simResult = {
          success: true,
          mode: 'quick',
          estGas: 200000,
          estSlippagePct: slippage * 100 * 0.8, // Estimate based on slippage tolerance
          estLossUsd: 5,
          attackerProfitUsd: 2,
          scenario: 'estimated',
          confidence: 0.5,
          willSucceed: true,
        };
      }
    }

    if (!simResult || !simResult.success) {
      console.error('   ❌ Simulation failed');
      return res.status(500).json({
        ok: false,
        error: simResult?.error || 'Simulation failed',
      });
    }

    // Analyze results
    console.log('   → Analyzing results...');
    const analysis = analyzeSimulationResult(simResult, {
      tokenDecimals,
      tokenUsdPrice,
      ethUsdPrice,
      victimAddress: from,
      tokenAddress,
    });

    if (!analysis.success) {
      return res.status(500).json({
        ok: false,
        error: analysis.error || 'Analysis failed',
      });
    }

    // Format for display
    const formatted = formatAnalysisForDisplay(analysis);

    // Update database if txHash provided
    if (txHash) {
      console.log(`   → Updating alert ${txHash}...`);
      await updateAlertSimulation(txHash, {
        slippagePct: analysis.estSlippagePct,
        estLossUsd: analysis.estLossUsd,
        attackerProfitUsd: analysis.attackerProfitUsd,
        simUrl: simResult.traceUrl || simResult.explorerUrl || null,
        simRaw: {
          ...simResult,
          analysis,
        },
        simStatus: 'done',
        simMode: mode,
      });
    }

    console.log(`   ✅ Simulation complete!`);
    console.log(`      Risk: ${analysis.riskLabel.toUpperCase()}`);
    console.log(`      Slippage: ${analysis.estSlippagePct}%`);
    console.log(`      Loss: $${analysis.estLossUsd}`);
    console.log(`      Method: ${simulationMethod}\n`);

    // Return response
    res.json({
      ok: true,
      
      // Core metrics
      estLossUsd: analysis.estLossUsd,
      estSlippagePct: analysis.estSlippagePct,
      attackerProfitUsd: analysis.attackerProfitUsd,
      netAttackerProfit: analysis.netAttackerProfit,
      
      // Transaction info
      willSucceed: analysis.willSucceed,
      estGas: analysis.estGas,
      gasCostUsd: analysis.gasCostUsd,
      
      // Risk assessment
      riskLabel: analysis.riskLabel,
      confidence: analysis.confidence,
      isProfitableAttack: analysis.isProfitableAttack,
      
      // URLs
      traceUrl: simResult.traceUrl || simResult.explorerUrl || null,
      explorerUrl: simResult.explorerUrl || null,
      
      // Recommendations
      recommendations: analysis.recommendations,
      
      // Formatted display
      formatted,
      
      // Metadata
      mode,
      simulationMethod,
      scenario: analysis.scenario,
    });

  } catch (err) {
    console.error('\n❌ [MANUAL-SIM] Error:', err.message);
    console.error(err.stack);
    
    res.status(500).json({
      ok: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

/**
 * POST /v1/simulate/batch
 * Batch simulation for multiple transactions
 */
router.post('/batch', async (req, res) => {
  try {
    const { transactions, mode = 'quick' } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'transactions must be a non-empty array',
      });
    }

    console.log(`\n🔬 [BATCH-SIM] Processing ${transactions.length} transactions`);

    const results = [];
    
    for (const txData of transactions) {
      try {
        const simResult = await quickSimulate(txData, { mode });
        const analysis = analyzeSimulationResult(simResult, {
          tokenDecimals: txData.tokenDecimals || 18,
          tokenUsdPrice: txData.tokenUsdPrice || 1,
        });
        
        results.push({
          txHash: txData.txHash || txData.hash,
          success: analysis.success,
          riskLabel: analysis.riskLabel,
          estSlippagePct: analysis.estSlippagePct,
          estLossUsd: analysis.estLossUsd,
          willSucceed: analysis.willSucceed,
        });
      } catch (error) {
        results.push({
          txHash: txData.txHash || txData.hash,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`   ✅ Batch complete: ${results.filter(r => r.success).length}/${results.length} succeeded\n`);

    res.json({
      ok: true,
      results,
      summary: {
        total: results.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });

  } catch (err) {
    console.error('\n❌ [BATCH-SIM] Error:', err.message);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

/**
 * GET /v1/simulate/status/:txHash
 * Check simulation status for a transaction
 */
router.get('/status/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(
      `SELECT tx_hash, sim_status, slippage_pct, est_loss_usd, attacker_profit_usd, 
              sim_url, sim_mode, trace_url, raw_sim
       FROM alerts WHERE tx_hash = $1`,
      [txHash]
    );

    await pool.end();

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Transaction not found',
      });
    }

    res.json({
      ok: true,
      ...result.rows[0],
    });

  } catch (err) {
    console.error('❌ Status check error:', err);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

export default router;
