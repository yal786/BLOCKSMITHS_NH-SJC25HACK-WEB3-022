// backend/sim/metrics.js
// Calculate slippage and loss metrics from simulation results
import BigNumber from 'bignumber.js';

/**
 * Compute slippage percentage and estimated USD loss
 * @param {string|BigInt} baselineOutWei - Expected output without frontrun
 * @param {string|BigInt} frontRunOutWei - Actual output with frontrun
 * @param {number} tokenDecimals - Token decimals (e.g., 18 for WETH, 6 for USDC)
 * @param {number} tokenUsdPrice - Current token price in USD
 * @returns {Object} - { slippagePct, estLossUsd }
 */
export function computeSlippageAndLoss(baselineOutWei, frontRunOutWei, tokenDecimals = 18, tokenUsdPrice = 1) {
  try {
    const baseline = new BigNumber(baselineOutWei.toString());
    const frontRun = new BigNumber(frontRunOutWei.toString());

    // If baseline is zero, can't calculate slippage
    if (baseline.isZero()) {
      return { slippagePct: 0, estLossUsd: 0 };
    }

    // Calculate difference
    const diff = baseline.minus(frontRun);

    // Slippage percentage: (baseline - frontRun) / baseline * 100
    const slippagePct = diff.dividedBy(baseline).multipliedBy(100).toNumber();

    // Convert loss to human-readable amount
    const lossAmount = diff.dividedBy(new BigNumber(10).pow(tokenDecimals));

    // Estimate USD loss
    const estLossUsd = lossAmount.multipliedBy(tokenUsdPrice).toNumber();

    return {
      slippagePct: Math.max(0, slippagePct), // Ensure non-negative
      estLossUsd: Math.max(0, estLossUsd),
      lossAmount: lossAmount.toNumber(),
    };
  } catch (error) {
    console.error('Error computing slippage:', error.message);
    return { slippagePct: 0, estLossUsd: 0 };
  }
}

/**
 * Calculate price impact percentage
 * @param {string|BigInt} amountIn - Input amount
 * @param {string|BigInt} amountOut - Output amount
 * @param {number} expectedRate - Expected exchange rate (output/input)
 * @returns {number} - Price impact percentage
 */
export function calculatePriceImpact(amountIn, amountOut, expectedRate) {
  try {
    const input = new BigNumber(amountIn.toString());
    const output = new BigNumber(amountOut.toString());

    if (input.isZero()) return 0;

    const expectedOut = input.multipliedBy(expectedRate);
    const actualRate = output.dividedBy(input);
    const impactPct = expectedOut.minus(output).dividedBy(expectedOut).multipliedBy(100);

    return Math.max(0, impactPct.toNumber());
  } catch (error) {
    console.error('Error calculating price impact:', error.message);
    return 0;
  }
}

/**
 * Estimate gas cost in USD
 * @param {number|string} gasUsed - Gas used
 * @param {number|string} gasPriceWei - Gas price in wei
 * @param {number} ethUsdPrice - ETH price in USD
 * @returns {number} - Gas cost in USD
 */
export function estimateGasCostUsd(gasUsed, gasPriceWei, ethUsdPrice = 3000) {
  try {
    const gas = new BigNumber(gasUsed.toString());
    const gasPrice = new BigNumber(gasPriceWei.toString());
    
    // Gas cost in ETH = gasUsed * gasPrice / 1e18
    const gasCostEth = gas.multipliedBy(gasPrice).dividedBy(new BigNumber(10).pow(18));
    
    // Convert to USD
    const gasCostUsd = gasCostEth.multipliedBy(ethUsdPrice);
    
    return gasCostUsd.toNumber();
  } catch (error) {
    console.error('Error estimating gas cost:', error.message);
    return 0;
  }
}

/**
 * Calculate total attack profit for attacker
 * @param {Object} frontrunSimResult - Frontrun transaction simulation
 * @param {Object} backrunSimResult - Backrun transaction simulation
 * @param {string} attackerAddress - Attacker's address
 * @param {number} tokenDecimals - Token decimals
 * @param {number} tokenUsdPrice - Token USD price
 * @returns {Object} - Profit analysis
 */
export function calculateAttackerProfit(
  frontrunSimResult,
  backrunSimResult,
  attackerAddress,
  tokenDecimals = 18,
  tokenUsdPrice = 1
) {
  try {
    // This would need to parse the transfer logs to find net token change
    // Simplified version - would need actual implementation based on logs
    
    return {
      grossProfitUsd: 0, // Placeholder
      gasCostUsd: 0,
      netProfitUsd: 0,
      note: 'Detailed profit calculation not yet implemented',
    };
  } catch (error) {
    console.error('Error calculating attacker profit:', error.message);
    return null;
  }
}

/**
 * Format metrics for display
 * @param {Object} metrics - Raw metrics
 * @returns {Object} - Formatted metrics
 */
export function formatMetrics(metrics) {
  return {
    slippagePct: metrics.slippagePct?.toFixed(2) + '%',
    estLossUsd: '$' + metrics.estLossUsd?.toFixed(2),
    lossAmount: metrics.lossAmount?.toFixed(6),
  };
}
