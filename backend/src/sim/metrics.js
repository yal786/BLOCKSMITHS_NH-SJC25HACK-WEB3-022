// backend/src/sim/metrics.js
// Enhanced metrics calculation with attacker profit
import BigNumber from 'bignumber.js';

/**
 * Compute slippage percentage and estimated USD loss
 * @param {string|BigInt} baselineOutWei - Expected output without frontrun
 * @param {string|BigInt} frontRunOutWei - Actual output with frontrun
 * @param {number} tokenDecimals - Token decimals (e.g., 18 for WETH, 6 for USDC)
 * @param {number} tokenUsdPrice - Current token price in USD
 * @returns {Object} - { slippagePct, estLossUsd, lossAmount }
 */
export function computeSlippageAndLoss(baselineOutWei, frontRunOutWei, tokenDecimals = 18, tokenUsdPrice = 1) {
  try {
    const baseline = new BigNumber(baselineOutWei.toString());
    const frontRun = new BigNumber(frontRunOutWei.toString());

    // If baseline is zero, can't calculate slippage
    if (baseline.isZero()) {
      return { slippagePct: 0, estLossUsd: 0, lossAmount: 0 };
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
    return { slippagePct: 0, estLossUsd: 0, lossAmount: 0 };
  }
}

/**
 * Compute attacker profit from sandwich attack
 * @param {string|BigInt} buyAmount - Amount attacker bought
 * @param {string|BigInt} sellAmount - Amount attacker sold
 * @param {number} tokenDecimals - Token decimals
 * @param {number} tokenUsdPrice - Token price in USD
 * @param {number} gasCost - Gas cost in USD
 * @returns {Object} - Profit metrics
 */
export function computeAttackerProfit(buyAmount, sellAmount, tokenDecimals = 18, tokenUsdPrice = 1, gasCost = 0) {
  try {
    const buy = new BigNumber(buyAmount.toString());
    const sell = new BigNumber(sellAmount.toString());

    // Gross profit in tokens
    const profitTokens = sell.minus(buy);
    const profitAmount = profitTokens.dividedBy(new BigNumber(10).pow(tokenDecimals));

    // Gross profit in USD
    const grossProfitUsd = profitAmount.multipliedBy(tokenUsdPrice).toNumber();

    // Net profit after gas
    const netProfitUsd = grossProfitUsd - gasCost;

    // Profit margin
    const buyValueUsd = buy.dividedBy(new BigNumber(10).pow(tokenDecimals)).multipliedBy(tokenUsdPrice);
    const profitMarginPct = buyValueUsd.isZero() 
      ? 0 
      : profitAmount.dividedBy(buy.dividedBy(new BigNumber(10).pow(tokenDecimals))).multipliedBy(100).toNumber();

    return {
      grossProfitUsd: Math.max(0, grossProfitUsd),
      netProfitUsd,
      profitMarginPct: Math.max(0, profitMarginPct),
      isProfitable: netProfitUsd > 0,
      profitTokens: profitTokens.toString(),
    };
  } catch (error) {
    console.error('Error computing attacker profit:', error.message);
    return {
      grossProfitUsd: 0,
      netProfitUsd: 0,
      profitMarginPct: 0,
      isProfitable: false,
      profitTokens: '0',
    };
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
 * Calculate comprehensive sandwich attack metrics
 * @param {Object} baselineResult - Baseline simulation result
 * @param {Object} sandwichResult - Sandwich simulation result
 * @param {Object} context - Token info and prices
 * @returns {Object} - Complete metrics
 */
export function calculateSandwichMetrics(baselineResult, sandwichResult, context = {}) {
  const {
    tokenDecimals = 18,
    tokenUsdPrice = 1,
    ethUsdPrice = 3000,
    gasPriceWei = 30e9, // 30 gwei
  } = context;

  try {
    // Calculate slippage and victim loss
    const slippageMetrics = computeSlippageAndLoss(
      baselineResult.tokenOut || '0',
      sandwichResult.victimTokenOut || '0',
      tokenDecimals,
      tokenUsdPrice
    );

    // Calculate gas costs
    const frontrunGasCost = estimateGasCostUsd(
      sandwichResult.frontrunGas || 0,
      gasPriceWei,
      ethUsdPrice
    );
    const backrunGasCost = estimateGasCostUsd(
      sandwichResult.backrunGas || 0,
      gasPriceWei,
      ethUsdPrice
    );
    const totalGasCost = frontrunGasCost + backrunGasCost;

    // Calculate attacker profit
    const profitMetrics = computeAttackerProfit(
      '0', // Buy amount (would need from simulation)
      sandwichResult.attackerProfit || '0',
      tokenDecimals,
      tokenUsdPrice,
      totalGasCost
    );

    // Determine if attack is profitable
    const isProfitable = profitMetrics.netProfitUsd > 0;

    // Calculate confidence score based on various factors
    const confidence = calculateConfidenceScore(
      slippageMetrics.slippagePct,
      profitMetrics.netProfitUsd,
      baselineResult,
      sandwichResult
    );

    return {
      slippagePct: slippageMetrics.slippagePct,
      victimLossUsd: slippageMetrics.estLossUsd,
      attackerProfitUsd: profitMetrics.grossProfitUsd,
      netAttackerProfit: profitMetrics.netProfitUsd,
      totalGasCost,
      isProfitable,
      confidence,
    };
  } catch (error) {
    console.error('Error calculating sandwich metrics:', error.message);
    return {
      slippagePct: 0,
      victimLossUsd: 0,
      attackerProfitUsd: 0,
      netAttackerProfit: 0,
      totalGasCost: 0,
      isProfitable: false,
      confidence: 0,
    };
  }
}

/**
 * Calculate confidence score for simulation
 */
function calculateConfidenceScore(slippagePct, profitUsd, baselineResult, sandwichResult) {
  let score = 0.5; // Base confidence

  // Increase confidence if we have concrete results
  if (baselineResult.gasUsed > 0) score += 0.1;
  if (sandwichResult.totalGas > 0) score += 0.1;

  // Increase confidence based on slippage magnitude
  if (slippagePct >= 2) score += 0.1;
  if (slippagePct >= 5) score += 0.1;

  // Increase confidence if attack is clearly profitable
  if (profitUsd > 10) score += 0.1;

  return Math.min(0.95, Math.max(0.3, score));
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
    attackerProfit: '$' + (metrics.attackerProfitUsd || 0).toFixed(2),
    netProfit: '$' + (metrics.netAttackerProfit || 0).toFixed(2),
    isProfitable: metrics.isProfitable ? '✅ Yes' : '❌ No',
  };
}

/**
 * Uniswap V2 getAmountOut formula
 */
export function getAmountOutV2(amountIn, reserveIn, reserveOut) {
  try {
    const amountInBN = new BigNumber(amountIn.toString());
    const reserveInBN = new BigNumber(reserveIn.toString());
    const reserveOutBN = new BigNumber(reserveOut.toString());

    if (amountInBN.isZero() || reserveInBN.isZero() || reserveOutBN.isZero()) {
      return '0';
    }

    // amountInWithFee = amountIn * 997
    const amountInWithFee = amountInBN.multipliedBy(997);
    
    // numerator = amountInWithFee * reserveOut
    const numerator = amountInWithFee.multipliedBy(reserveOutBN);
    
    // denominator = (reserveIn * 1000) + amountInWithFee
    const denominator = reserveInBN.multipliedBy(1000).plus(amountInWithFee);
    
    // amountOut = numerator / denominator
    const amountOut = numerator.dividedToIntegerBy(denominator);
    
    return amountOut.toString();
  } catch (error) {
    console.error('Error calculating Uniswap V2 output:', error.message);
    return '0';
  }
}

export default {
  computeSlippageAndLoss,
  computeAttackerProfit,
  calculatePriceImpact,
  estimateGasCostUsd,
  calculateSandwichMetrics,
  formatMetrics,
  getAmountOutV2,
};
