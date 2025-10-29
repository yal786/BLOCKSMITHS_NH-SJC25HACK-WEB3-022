// backend/src/queue/simQueue.js
// Queue manager for automatic simulation jobs
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export const simQueue = new Queue('simulations', { connection });

/**
 * Enqueue an automatic simulation job (called by detector)
 * @param {Object} jobData - Simulation job data
 * @returns {Promise<Job>} - BullMQ job
 */
export async function enqueueAutoSimulation(jobData) {
  const {
    tx,
    txHash,
    riskLevel,
    victimAddress,
    tokenAddress,
    tokenDecimals = 18,
    tokenUsdPrice = 1,
    ethUsdPrice = 3000,
    mode = 'quick', // 'quick' for MEDIUM risk, 'deep' for HIGH risk
  } = jobData;

  try {
    // Determine mode based on risk level
    const simMode = riskLevel === 'HIGH' || riskLevel === 'CRITICAL' ? 'deep' : 'quick';

    const job = await simQueue.add(
      'auto-simulate',
      {
        tx,
        txHash,
        riskLevel,
        victimAddress,
        tokenAddress,
        tokenDecimals,
        tokenUsdPrice,
        ethUsdPrice,
        mode: simMode,
        triggeredBy: 'detector',
        timestamp: new Date().toISOString(),
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
        priority: riskLevel === 'HIGH' ? 1 : riskLevel === 'MEDIUM' ? 2 : 3,
      }
    );

    console.log(`📨 [QUEUE] Enqueued auto-simulation job ${job.id} for ${txHash}`);
    console.log(`   Risk: ${riskLevel} | Mode: ${simMode} | Priority: ${job.opts.priority}`);
    
    return job;
  } catch (error) {
    console.error('❌ [QUEUE] Failed to enqueue simulation:', error.message);
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
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
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
 * Get jobs by status
 */
export async function getJobsByStatus(status = 'completed', start = 0, end = 10) {
  const jobs = await simQueue.getJobs([status], start, end);
  return jobs.map(job => ({
    id: job.id,
    name: job.name,
    data: job.data,
    returnvalue: job.returnvalue,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  }));
}

/**
 * Clear completed jobs
 */
export async function clearCompleted() {
  await simQueue.clean(0, 1000, 'completed');
  console.log('🧹 [QUEUE] Cleared completed simulation jobs');
}

/**
 * Clear failed jobs
 */
export async function clearFailed() {
  await simQueue.clean(0, 1000, 'failed');
  console.log('🧹 [QUEUE] Cleared failed simulation jobs');
}

/**
 * Pause queue
 */
export async function pauseQueue() {
  await simQueue.pause();
  console.log('⏸️ [QUEUE] Queue paused');
}

/**
 * Resume queue
 */
export async function resumeQueue() {
  await simQueue.resume();
  console.log('▶️ [QUEUE] Queue resumed');
}

/**
 * Get queue health status
 */
export async function getQueueHealth() {
  const isPaused = await simQueue.isPaused();
  const metrics = await getQueueMetrics();
  
  const health = {
    status: isPaused ? 'paused' : 'active',
    isPaused,
    metrics,
    timestamp: new Date().toISOString(),
  };

  // Check for issues
  if (metrics.failed > 10) {
    health.warning = 'High number of failed jobs';
  }
  if (metrics.waiting > 50) {
    health.warning = 'High number of waiting jobs - consider scaling workers';
  }

  return health;
}

export default simQueue;
