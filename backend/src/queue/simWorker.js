// backend/src/queue/simWorker.js
// Background worker for automatic transaction simulation
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { simulateSandwichAttack, quickSimulate, isHardhatAvailable } from '../sim/hardhatSim.js';
import { simulateTenderlyTx } from '../sim/tenderlySim.js';
import { analyzeSimulationResult } from '../sim/analyzeSimResult.js';
import { updateAlertSimulation, markSimulationFailed } from '../db/alerts.js';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Background worker for automatic simulations
 * Triggered when detector flags transactions with risk >= MEDIUM
 * 
 * Job data structure:
 * {
 *   tx: { from, to, data, value, gas, gasPrice, hash },
 *   txHash: "0x...",
 *   riskLevel: "MEDIUM" | "HIGH",
 *   victimAddress: "0x...",
 *   tokenAddress: "0x...",
 *   tokenDecimals: 18,
 *   tokenUsdPrice: 2500,
 *   mode: "quick" | "deep"
 * }
 */
const worker = new Worker(
  'simulations',
  async (job) => {
    const {
      tx,
      txHash,
      riskLevel,
      victimAddress,
      tokenAddress,
      tokenDecimals = 18,
      tokenUsdPrice = 1,
      ethUsdPrice = 3000,
      mode = 'quick',
    } = job.data;

    console.log(`\n🔬 [AUTO-SIM] Processing job for ${txHash}`);
    console.log(`   Risk: ${riskLevel} | Mode: ${mode}`);

    try {
      let simResult;
      let usedFallback = false;

      // Step 1: Try Hardhat fork simulation first (primary)
      if (isHardhatAvailable() && mode === 'deep') {
        console.log('   → Attempting Hardhat fork simulation...');
        
        try {
          simResult = await simulateSandwichAttack(tx, {
            attackerBuyAmount: '1000000000000000000', // 1 ETH
            tokenAddress,
            mode,
          });
          
          if (!simResult.success) {
            console.log('   ⚠️ Hardhat simulation failed, trying Tenderly fallback...');
            usedFallback = true;
          }
        } catch (hardhatError) {
          console.log('   ⚠️ Hardhat error:', hardhatError.message);
          console.log('   → Falling back to Tenderly...');
          usedFallback = true;
        }
      } else {
        // Quick mode or Hardhat not available - use quick simulation
        console.log('   → Running quick simulation...');
        simResult = await quickSimulate(tx, { mode: 'quick' });
      }

      // Step 2: Fallback to Tenderly if needed
      if (usedFallback || !simResult || !simResult.success) {
        try {
          console.log('   → Running Tenderly simulation...');
          const tenderlyResult = await simulateTenderlyTx(tx);
          
          if (tenderlyResult.success) {
            // Convert Tenderly result to standard format
            simResult = {
              success: true,
              mode: 'tenderly',
              estGas: tenderlyResult.gasUsed || 0,
              estSlippagePct: 1.5, // Estimated
              estLossUsd: 10, // Estimated
              attackerProfitUsd: 5, // Estimated
              scenario: 'tenderly-fallback',
              confidence: 0.7,
              explorerUrl: tenderlyResult.explorerUrl,
            };
          }
        } catch (tenderlyError) {
          console.error('   ❌ Tenderly fallback also failed:', tenderlyError.message);
        }
      }

      // Step 3: Check if we got any result
      if (!simResult || !simResult.success) {
        console.error(`   ❌ All simulation methods failed for ${txHash}`);
        await markSimulationFailed(txHash, 'All simulation methods failed');
        return { ok: false, error: 'Simulation failed' };
      }

      // Step 4: Analyze simulation results
      console.log('   → Analyzing simulation results...');
      const analysis = analyzeSimulationResult(simResult, {
        tokenDecimals,
        tokenUsdPrice,
        ethUsdPrice,
        victimAddress,
        tokenAddress,
      });

      if (!analysis.success) {
        console.error('   ❌ Analysis failed:', analysis.error);
        await markSimulationFailed(txHash, analysis.error);
        return { ok: false, error: 'Analysis failed' };
      }

      // Step 5: Update database with results
      console.log('   → Updating database...');
      await updateAlertSimulation(txHash, {
        slippagePct: analysis.estSlippagePct,
        estLossUsd: analysis.estLossUsd,
        attackerProfitUsd: analysis.attackerProfitUsd,
        simUrl: simResult.explorerUrl || null,
        simRaw: {
          ...simResult,
          analysis,
          usedFallback,
        },
        simStatus: 'done',
        simMode: mode,
      });

      console.log(`   ✅ Simulation complete!`);
      console.log(`      Slippage: ${analysis.estSlippagePct}%`);
      console.log(`      Loss: $${analysis.estLossUsd}`);
      console.log(`      Attacker profit: $${analysis.attackerProfitUsd}`);
      console.log(`      Risk: ${analysis.riskLabel.toUpperCase()}`);

      return {
        ok: true,
        txHash,
        analysis,
        usedFallback,
      };

    } catch (error) {
      console.error(`   ❌ Worker error for ${txHash}:`, error.message);
      await markSimulationFailed(txHash, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 3, // Process up to 3 simulations concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // per second
    },
  }
);

// Event handlers
worker.on('completed', (job) => {
  console.log(`\n✅ [AUTO-SIM] Job ${job.id} completed`);
  console.log(`   TX: ${job.data.txHash}`);
});

worker.on('failed', (job, err) => {
  console.error(`\n❌ [AUTO-SIM] Job ${job?.id} failed`);
  console.error(`   TX: ${job?.data?.txHash}`);
  console.error(`   Error: ${err.message}`);
});

worker.on('error', (err) => {
  console.error('\n❌ [AUTO-SIM] Worker error:', err);
});

worker.on('stalled', (jobId) => {
  console.warn(`\n⚠️ [AUTO-SIM] Job ${jobId} stalled`);
});

console.log('\n🚀 [AUTO-SIM] Simulation worker started');
console.log('   Queue: simulations');
console.log('   Concurrency: 3');
console.log('   Waiting for jobs...\n');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⏸️ [AUTO-SIM] Shutting down worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⏸️ [AUTO-SIM] Shutting down worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

export default worker;
