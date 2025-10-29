// backend/src/sim/analyzeSimResult.js
// Analyze simulation results and compute comprehensive metrics
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

/**
 * Analyze simulation result and return structured metrics
 * @param {Object} simResult - Result from hardhatSim or tenderlySim
 * @param {Object} context - Additional context (token info, prices, etc.)
 * @returns {Object} - Analyzed metrics with risk classification
 */
export function analyzeSimulationResult(simResult, context = {}) {
  if (!simResult.success) {
    return {
      success: false,
      error: simResult.error,
      riskLabel: 'unknown',
    };
  }

  const {
    tokenDecimals = 18,
    tokenUsdPrice = 1,
    ethUsdPrice = 3000,
    victimAddress = null,
    tokenAddress = null,
  } = context;

  try {
    // Extract key metrics
    const estSlippagePct = simResult.estSlippagePct || 0;
    const estLossUsd = simResult.estLossUsd || 0;
    const attackerProfitUsd = simResult.attackerProfitUsd || 0;
    const estGas = simResult.estGas || 0;
    const confidence = simResult.confidence || 0.5;

    // Calculate gas cost in USD
    const gasPrice = 30e9; // 30 gwei average
    const gasCostEth = (estGas * gasPrice) / 1e18;
    const gasCostUsd = gasCostEth * ethUsdPrice;

    // Calculate net profit for attacker (profit - gas cost)
    const netAttackerProfit = attackerProfitUsd - gasCostUsd;

    // Determine risk label based on slippage and loss
    const riskLabel = classifyRisk(estSlippagePct, estLossUsd, attackerProfitUsd);

    // Calculate profitability for attacker
    const isProfitableAttack = netAttackerProfit > 0;

    // Determine if transaction will likely succeed
    const willSucceed = estimateSuccess(simResult);

    return {
      success: true,
      
      // Core metrics
      estSlippagePct: parseFloat(estSlippagePct.toFixed(2)),
      estLossUsd: parseFloat(estLossUsd.toFixed(2)),
      attackerProfitUsd: parseFloat(attackerProfitUsd.toFixed(2)),
      netAttackerProfit: parseFloat(netAttackerProfit.toFixed(2)),
      
      // Gas metrics
      estGas,
      gasCostUsd: parseFloat(gasCostUsd.toFixed(2)),
      
      // Risk assessment
      riskLabel, // 'safe', 'low', 'medium', 'high', 'critical'
      confidence: parseFloat(confidence.toFixed(2)),
      isProfitableAttack,
      willSucceed,
      
      // Scenario info
      scenario: simResult.scenario || 'unknown',
      mode: simResult.mode || 'quick',
      
      // Additional context
      recommendations: generateRecommendations(riskLabel, estSlippagePct, isProfitableAttack),
      
      // Raw data
      raw: {
        baseline: simResult.baseline,
        sandwich: simResult.sandwich,
      },
    };
  } catch (error) {
    console.error('Error analyzing simulation result:', error.message);
    return {
      success: false,
      error: error.message,
      riskLabel: 'unknown',
    };
  }
}

/**
 * Classify risk level based on metrics
 */
function classifyRisk(slippagePct, lossUsd, attackerProfitUsd) {
  // Critical: Very high slippage or loss
  if (slippagePct >= 5 || lossUsd >= 100) {
    return 'critical';
  }
  
  // High: Significant slippage/loss and profitable attack
  if ((slippagePct >= 3 || lossUsd >= 50) && attackerProfitUsd > 10) {
    return 'high';
  }
  
  // Medium: Moderate slippage/loss
  if (slippagePct >= 1.5 || lossUsd >= 20) {
    return 'medium';
  }
  
  // Low: Small slippage but detectable
  if (slippagePct >= 0.5 || lossUsd >= 5) {
    return 'low';
  }
  
  // Safe: Negligible impact
  return 'safe';
}

/**
 * Estimate if transaction will succeed
 */
function estimateSuccess(simResult) {
  // If simulation itself succeeded, transaction should succeed
  if (simResult.success && simResult.estGas > 0 && simResult.estGas < 10000000) {
    return true;
  }
  
  // If we have baseline data and it succeeded
  if (simResult.baseline && simResult.baseline.gasUsed > 0) {
    return true;
  }
  
  return false;
}

/**
 * Generate recommendations based on risk analysis
 */
function generateRecommendations(riskLabel, slippagePct, isProfitableAttack) {
  const recommendations = [];
  
  if (riskLabel === 'critical' || riskLabel === 'high') {
    recommendations.push('⚠️ HIGH RISK: Use Flashbots Protect or cancel transaction');
    recommendations.push('Consider splitting transaction into smaller chunks');
  }
  
  if (slippagePct >= 2) {
    recommendations.push(`Increase slippage tolerance to at least ${(slippagePct * 1.5).toFixed(1)}%`);
  }
  
  if (isProfitableAttack) {
    recommendations.push('Transaction is profitable for MEV attackers');
    recommendations.push('Use private RPC or protected relay');
  }
  
  if (riskLabel === 'medium') {
    recommendations.push('⚡ MEDIUM RISK: Consider using MEV protection');
    recommendations.push('Monitor transaction closely');
  }
  
  if (riskLabel === 'low' || riskLabel === 'safe') {
    recommendations.push('✅ Transaction appears safe to broadcast');
  }
  
  return recommendations;
}

/**
 * Parse token balance changes from logs
 */
export function parseTokenTransfers(logs, tokenAddress, targetAddress) {
  const ERC20_TRANSFER_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ];
  const iface = new ethers.Interface(ERC20_TRANSFER_ABI);
  
  const transfers = [];
  let netChange = BigInt(0);
  
  for (const log of logs) {
    try {
      if (tokenAddress && log.address.toLowerCase() !== tokenAddress.toLowerCase()) {
        continue;
      }
      
      const parsed = iface.parseLog({
        topics: log.topics,
        data: log.data,
      });
      
      if (parsed && parsed.name === 'Transfer') {
        const from = parsed.args.from.toLowerCase();
        const to = parsed.args.to.toLowerCase();
        const value = parsed.args.value;
        
        transfers.push({ from, to, value: value.toString() });
        
        // Track net change for target address
        if (targetAddress) {
          const target = targetAddress.toLowerCase();
          if (to === target) {
            netChange += value;
          }
          if (from === target) {
            netChange -= value;
          }
        }
      }
    } catch (err) {
      // Not a Transfer event or parsing failed
    }
  }
  
  return {
    transfers,
    netChange: netChange.toString(),
  };
}

/**
 * Compare baseline vs attack scenario
 */
export function compareScenarios(baselineResult, attackResult) {
  try {
    const baselineOut = BigInt(baselineResult.tokenOut || 0);
    const attackOut = BigInt(attackResult.victimTokenOut || 0);
    
    const diff = baselineOut - attackOut;
    const impactPct = baselineOut > 0n 
      ? Number((diff * 10000n) / baselineOut) / 100 
      : 0;
    
    return {
      baselineOut: baselineOut.toString(),
      attackOut: attackOut.toString(),
      difference: diff.toString(),
      impactPct: parseFloat(impactPct.toFixed(2)),
      attackerAdvantage: attackResult.attackerProfit || '0',
    };
  } catch (error) {
    console.error('Error comparing scenarios:', error.message);
    return null;
  }
}

/**
 * Format analysis for display
 */
export function formatAnalysisForDisplay(analysis) {
  if (!analysis.success) {
    return {
      status: '❌ Simulation Failed',
      error: analysis.error,
    };
  }
  
  const riskEmoji = {
    safe: '✅',
    low: '🟡',
    medium: '🟠',
    high: '🔴',
    critical: '⛔',
  }[analysis.riskLabel] || '⚠️';
  
  return {
    status: `${riskEmoji} ${analysis.riskLabel.toUpperCase()} RISK`,
    summary: `${analysis.estSlippagePct}% slippage, $${analysis.estLossUsd} estimated loss`,
    confidence: `${(analysis.confidence * 100).toFixed(0)}% confidence`,
    willSucceed: analysis.willSucceed ? '✅ Will succeed' : '❌ May fail',
    gas: `${analysis.estGas.toLocaleString()} gas ($${analysis.gasCostUsd})`,
    recommendations: analysis.recommendations,
    attackerProfit: analysis.isProfitableAttack 
      ? `⚠️ Attacker profit: $${analysis.attackerProfitUsd}` 
      : '✅ Not profitable for attackers',
  };
}

export default {
  analyzeSimulationResult,
  parseTokenTransfers,
  compareScenarios,
  formatAnalysisForDisplay,
};
