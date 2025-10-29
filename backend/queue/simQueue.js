// backend/queue/simQueue.js
// Queue manager for simulation jobs
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const simQueue = new Queue('simulations', { connection });

/**
 * Enqueue a simulation job
 * @param {Object} jobData - Simulation job data
 * @returns {Promise<Job>} - BullMQ job
 */
export async function enqueueSimulation(jobData) {
  const {
    tx,
    txHash,
    victimAddress,
    tokenAddress,
    baselineTokenOutWei,
    tokenDecimals = 18,
    tokenUsdPrice = 1.0,
  } = jobData;

  try {
    const job = await simQueue.add(
      'simulate',
      {
        tx,
        txHash,
        victimAddress,
        tokenAddress,
        baselineTokenOutWei,
        tokenDecimals,
        tokenUsdPrice,
      },
      {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2s delay
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep last 1000 completed jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
        },
      }
    );

    console.log(`📨 Enqueued simulation job ${job.id} for ${txHash}`);
    return job;
  } catch (error) {
    console.error('❌ Failed to enqueue simulation:', error.message);
    throw error;
  }
}

/**
 * Get job status
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} - Job status
 */
export async function getJobStatus(jobId) {
  const job = await simQueue.getJob(jobId);
  
  if (!job) {
    return { found: false };
  }

  const state = await job.getState();
  const progress = job.progress;
  const returnValue = job.returnvalue;

  return {
    found: true,
    id: job.id,
    state,
    progress,
    result: returnValue,
    data: job.data,
  };
}

/**
 * Get queue metrics
 * @returns {Promise<Object>} - Queue statistics
 */
export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    simQueue.getWaitingCount(),
    simQueue.getActiveCount(),
    simQueue.getCompletedCount(),
    simQueue.getFailedCount(),
    simQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Clear completed jobs
 */
export async function clearCompleted() {
  await simQueue.clean(0, 1000, 'completed');
  console.log('🧹 Cleared completed simulation jobs');
}

/**
 * Clear failed jobs
 */
export async function clearFailed() {
  await simQueue.clean(0, 1000, 'failed');
  console.log('🧹 Cleared failed simulation jobs');
}

export default simQueue;
