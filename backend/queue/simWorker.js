// backend/queue/simWorker.js
// BullMQ worker for background transaction simulation
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { simulateTenderlyTx } from '../sim/simulateTx.js';
import { parseTenderlySimulation } from '../sim/analyzeSimulation.js';
import { updateAlertSimulation, markSimulationFailed } from '../utils/alerts.js';
import { computeSlippageAndLoss } from '../sim/metrics.js';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Job handler for simulation queue
 * Expected job data:
 * {
 *   tx: { from, to, data, value, gas, gasPrice, networkId },
 *   txHash: "0x...",
 *   victimAddress: "0x...",
 *   tokenAddress: "0x...",
 *   baselineTokenOutWei: "1000000000000000000",
 *   tokenDecimals: 18,
 *   tokenUsdPrice: 1.0
 * }
 */
const worker = new Worker(
  'simulations',
  async (job) => {
    const {
      tx,
      txHash,
      victimAddress,
      tokenAddress,
      baselineTokenOutWei,
      tokenDecimals = 18,
      tokenUsdPrice = 1.0,
    } = job.data;

    console.log(`🔬 Processing simulation job for ${txHash}`);

    try {
      // Run simulation
      const simRes = await simulateTenderlyTx(tx);

      if (!simRes.success) {
        console.error(`❌ Simulation failed for ${txHash}:`, simRes.error);
        await markSimulationFailed(txHash, simRes.error);
        return { ok: false, error: simRes.error };
      }

      // Parse results
      const parsed = parseTenderlySimulation(simRes, {
        victimAddressLower: victimAddress?.toLowerCase(),
        tokenAddressLower: tokenAddress?.toLowerCase(),
      });

      let slippagePct = null;
      let estLossUsd = null;

      // Calculate metrics
      if (parsed.tokenOut && baselineTokenOutWei && tokenDecimals && tokenUsdPrice) {
        const metrics = computeSlippageAndLoss(
          baselineTokenOutWei,
          parsed.tokenOut,
          tokenDecimals,
          tokenUsdPrice
        );
        slippagePct = metrics.slippagePct;
        estLossUsd = metrics.estLossUsd;

        console.log(`📊 Metrics for ${txHash}: Slippage=${slippagePct.toFixed(2)}%, Loss=$${estLossUsd.toFixed(2)}`);
      }

      // Update database
      await updateAlertSimulation(txHash, {
        slippagePct,
        estLossUsd,
        simUrl: parsed.explorerUrl,
        simRaw: parsed.raw,
        simStatus: 'done',
      });

      console.log(`✅ Simulation complete for ${txHash}`);
      return { ok: true, slippagePct, estLossUsd };

    } catch (error) {
      console.error(`❌ Worker error for ${txHash}:`, error.message);
      await markSimulationFailed(txHash, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 simulations concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // per second
    },
  }
);

// Event handlers
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed for ${job.data.txHash}`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed for ${job?.data?.txHash}:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log('🚀 Simulation worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏸️  Shutting down simulation worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

export default worker;
