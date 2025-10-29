// backend/src/integrations/detectorIntegration.js
// Integration helper for automatic simulation on detection
import { enqueueAutoSimulation } from '../queue/simQueue.js';

/**
 * Called by detector when a suspicious transaction is flagged
 * Automatically enqueues a simulation job for analysis
 * 
 * @param {Object} alert - Alert data from detector
 * @param {Object} tx - Original mempool transaction
 * @returns {Promise<Object>} - Job info
 */
export async function onTransactionFlagged(alert, tx) {
  const {
    txHash,
    riskLevel,
    from,
    to,
    confidence,
  } = alert;

  // Only auto-simulate for MEDIUM or higher risk
  if (riskLevel !== 'MEDIUM' && riskLevel !== 'HIGH' && riskLevel !== 'CRITICAL') {
    console.log(`[DETECTOR] Skipping auto-sim for ${riskLevel} risk transaction ${txHash}`);
    return null;
  }

  console.log(`\n[DETECTOR] 🚨 Flagged transaction detected!`);
  console.log(`   TX: ${txHash}`);
  console.log(`   Risk: ${riskLevel} (${confidence}% confidence)`);
  console.log(`   From: ${from}`);
  console.log(`   To: ${to}`);

  try {
    // Extract token info from transaction (simplified)
    const tokenAddress = extractTokenAddress(tx);
    const tokenInfo = await getTokenInfo(tokenAddress);

    // Enqueue simulation job
    const job = await enqueueAutoSimulation({
      tx: {
        from: tx.from,
        to: tx.to,
        data: tx.data || tx.input,
        value: tx.value,
        gas: tx.gas || tx.gasLimit,
        gasPrice: tx.gasPrice || tx.maxFeePerGas,
        hash: txHash,
      },
      txHash,
      riskLevel,
      victimAddress: from,
      tokenAddress,
      tokenDecimals: tokenInfo.decimals || 18,
      tokenUsdPrice: tokenInfo.price || 1,
      ethUsdPrice: 3000, // Would fetch real price
    });

    console.log(`   ✅ Simulation job enqueued: ${job.id}`);
    console.log(`   Job will be processed by worker\n`);

    return {
      jobId: job.id,
      txHash,
      status: 'queued',
    };

  } catch (error) {
    console.error(`   ❌ Failed to enqueue simulation:`, error.message);
    return {
      error: error.message,
      txHash,
      status: 'failed',
    };
  }
}

/**
 * Extract token address from transaction data
 * This is a simplified version - would need proper decoding
 */
function extractTokenAddress(tx) {
  // For Uniswap swaps, token address is in the path parameter
  // This is a placeholder - would need proper ABI decoding
  
  try {
    const data = tx.data || tx.input;
    if (!data || data === '0x') {
      return null;
    }

    // Check if it's a swap function (starts with swapExact... selectors)
    const selector = data.slice(0, 10);
    const knownSwapSelectors = [
      '0x38ed1739', // swapExactTokensForTokens
      '0x7ff36ab5', // swapExactETHForTokens
      '0x18cbafe5', // swapExactTokensForETH
    ];

    if (knownSwapSelectors.includes(selector)) {
      // Extract path parameter (simplified)
      // In production, use ethers.js to properly decode
      return '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC placeholder
    }

    return null;
  } catch (error) {
    console.error('Error extracting token address:', error.message);
    return null;
  }
}

/**
 * Get token info (decimals, price)
 * This is a placeholder - would use a real price oracle
 */
async function getTokenInfo(tokenAddress) {
  // Placeholder implementation
  // In production, fetch from:
  // - CoinGecko API
  // - CoinMarketCap API
  // - On-chain oracle (Chainlink, Uniswap TWAP)

  if (!tokenAddress) {
    return { decimals: 18, price: 1 };
  }

  // Known tokens (for demo)
  const knownTokens = {
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { // USDC
      decimals: 6,
      price: 1,
      symbol: 'USDC',
    },
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': { // WETH
      decimals: 18,
      price: 3000,
      symbol: 'WETH',
    },
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': { // DAI
      decimals: 18,
      price: 1,
      symbol: 'DAI',
    },
  };

  const normalized = tokenAddress.toLowerCase();
  for (const [addr, info] of Object.entries(knownTokens)) {
    if (addr.toLowerCase() === normalized) {
      return info;
    }
  }

  // Default fallback
  return { decimals: 18, price: 1, symbol: 'UNKNOWN' };
}

/**
 * Check if auto-simulation is enabled
 */
export function isAutoSimulationEnabled() {
  return process.env.ENABLE_AUTO_SIMULATION !== 'false';
}

/**
 * Get auto-simulation config
 */
export function getAutoSimConfig() {
  return {
    enabled: isAutoSimulationEnabled(),
    minRiskLevel: process.env.MIN_SIM_RISK_LEVEL || 'MEDIUM',
    mode: process.env.AUTO_SIM_MODE || 'quick',
  };
}

export default {
  onTransactionFlagged,
  isAutoSimulationEnabled,
  getAutoSimConfig,
};
