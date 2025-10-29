// backend/src/sim/hardhatSim.js
// Local fork simulation using ethers.js (Hardhat-style but using Alchemy fork)
import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const ALCHEMY_RPC = process.env.ALCHEMY_HTTPS || 'https://eth-mainnet.g.alchemy.com/v2/demo';

// Common DEX router addresses
const UNISWAP_V2_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

// Attacker wallet for simulation (well-funded mainnet address for testing)
const ATTACKER_ADDRESS = '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503'; // Binance hot wallet

/**
 * Simulate a sandwich attack using ethers.js fork
 * @param {Object} victimTx - The victim's transaction
 * @param {Object} options - Simulation options
 * @returns {Promise<Object>} - Simulation results
 */
export async function simulateSandwichAttack(victimTx, options = {}) {
  const {
    attackerBuyAmount = '1000000000000000000', // 1 ETH default
    tokenAddress = null,
    mode = 'quick', // 'quick' or 'deep'
  } = options;

  try {
    // Create provider for mainnet fork simulation
    const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC);
    
    // Get latest block for accurate simulation
    const latestBlock = await provider.getBlockNumber();
    
    console.log(`🔬 Simulating sandwich attack at block ${latestBlock}`);
    console.log(`   Victim tx: ${victimTx.hash || 'pending'}`);
    console.log(`   Attacker buy: ${ethers.formatEther(attackerBuyAmount)} ETH`);

    // Step 1: Get baseline (victim tx alone)
    const baselineResult = await simulateVictimTxAlone(provider, victimTx);
    
    if (!baselineResult.success) {
      return {
        success: false,
        error: 'Baseline simulation failed',
        details: baselineResult.error,
      };
    }

    // Step 2: Simulate sandwich attack sequence
    const sandwichResult = await simulateSandwichSequence(
      provider,
      victimTx,
      attackerBuyAmount,
      tokenAddress
    );

    if (!sandwichResult.success) {
      return {
        success: false,
        error: 'Sandwich simulation failed',
        details: sandwichResult.error,
      };
    }

    // Step 3: Calculate metrics
    const metrics = calculateSandwichMetrics(baselineResult, sandwichResult);

    return {
      success: true,
      mode,
      estGas: sandwichResult.totalGas,
      estSlippagePct: metrics.slippagePct,
      estLossUsd: metrics.victimLossUsd,
      attackerProfitUsd: metrics.attackerProfitUsd,
      scenario: 'sandwich',
      confidence: metrics.confidence,
      baseline: {
        gasUsed: baselineResult.gasUsed,
        tokenOut: baselineResult.tokenOut,
      },
      sandwich: {
        frontrunGas: sandwichResult.frontrunGas,
        victimGas: sandwichResult.victimGas,
        backrunGas: sandwichResult.backrunGas,
        victimTokenOut: sandwichResult.victimTokenOut,
        attackerProfit: sandwichResult.attackerProfit,
      },
    };

  } catch (error) {
    console.error('❌ Hardhat simulation error:', error.message);
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}

/**
 * Simulate victim transaction alone (baseline)
 */
async function simulateVictimTxAlone(provider, victimTx) {
  try {
    // Estimate gas for the transaction
    const gasEstimate = await provider.estimateGas({
      from: victimTx.from,
      to: victimTx.to,
      data: victimTx.data || victimTx.input,
      value: victimTx.value || '0x0',
    });

    // For DEX swaps, extract expected output from transaction data
    const tokenOut = await estimateSwapOutput(provider, victimTx);

    return {
      success: true,
      gasUsed: Number(gasEstimate),
      tokenOut,
    };
  } catch (error) {
    console.error('Baseline simulation error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Simulate 3-transaction sandwich sequence
 */
async function simulateSandwichSequence(provider, victimTx, attackerBuyAmount, tokenAddress) {
  try {
    // For a proper sandwich, we need to:
    // 1. Frontrun: Attacker buys tokens, pushing price up
    // 2. Victim: User's swap executes at worse price
    // 3. Backrun: Attacker sells tokens at higher price

    // Simplified version for MVP - estimate gas and token changes
    const frontrunGas = 150000; // Typical swap gas
    const victimGas = await provider.estimateGas({
      from: victimTx.from,
      to: victimTx.to,
      data: victimTx.data || victimTx.input,
      value: victimTx.value || '0x0',
    });
    const backrunGas = 150000;

    // Estimate victim's output after frontrun (worse than baseline)
    const victimTokenOut = await estimateSwapOutput(provider, victimTx);
    
    // Apply price impact from frontrun (simplified: 2-5% worse)
    const priceImpact = 0.03; // 3% average
    const victimTokenOutAfterFrontrun = BigInt(Math.floor(Number(victimTokenOut) * (1 - priceImpact)));

    // Estimate attacker profit (simplified)
    const attackerProfitTokens = BigInt(Math.floor(Number(attackerBuyAmount) * priceImpact));

    return {
      success: true,
      frontrunGas: Number(frontrunGas),
      victimGas: Number(victimGas),
      backrunGas: Number(backrunGas),
      totalGas: Number(frontrunGas) + Number(victimGas) + Number(backrunGas),
      victimTokenOut: victimTokenOutAfterFrontrun.toString(),
      attackerProfit: attackerProfitTokens.toString(),
    };
  } catch (error) {
    console.error('Sandwich sequence error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Estimate swap output from transaction data
 */
async function estimateSwapOutput(provider, tx) {
  try {
    // Try to decode swap data
    const iface = new ethers.Interface([
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)',
      'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline)',
      'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] path, address to, uint deadline)',
    ]);

    try {
      const decoded = iface.parseTransaction({ data: tx.data || tx.input });
      
      if (decoded.name === 'swapExactTokensForTokens' || decoded.name === 'swapExactETHForTokens') {
        // Return the minimum output amount from the transaction
        return decoded.args.amountOutMin?.toString() || '1000000000000000000';
      }
    } catch (e) {
      // Not a standard swap, return default
    }

    // Default: assume 1 token output (1e18)
    return '1000000000000000000';
  } catch (error) {
    return '1000000000000000000';
  }
}

/**
 * Calculate sandwich attack metrics
 */
function calculateSandwichMetrics(baseline, sandwich) {
  try {
    const baselineOut = BigInt(baseline.tokenOut);
    const sandwichOut = BigInt(sandwich.victimTokenOut);
    const attackerProfit = BigInt(sandwich.attackerProfit);

    // Calculate slippage
    const diff = baselineOut - sandwichOut;
    const slippagePct = baselineOut > 0n 
      ? Number((diff * 10000n) / baselineOut) / 100 
      : 0;

    // Estimate USD values (simplified - assume 1 token = $2500)
    const tokenUsdPrice = 2500;
    const tokenDecimals = 18;
    
    const victimLossUsd = Number(diff) / Math.pow(10, tokenDecimals) * tokenUsdPrice;
    const attackerProfitUsd = Number(attackerProfit) / Math.pow(10, tokenDecimals) * tokenUsdPrice;

    // Calculate confidence based on slippage magnitude
    const confidence = Math.min(0.95, Math.max(0.5, slippagePct / 10));

    return {
      slippagePct,
      victimLossUsd,
      attackerProfitUsd,
      confidence,
    };
  } catch (error) {
    console.error('Metrics calculation error:', error.message);
    return {
      slippagePct: 0,
      victimLossUsd: 0,
      attackerProfitUsd: 0,
      confidence: 0,
    };
  }
}

/**
 * Quick simulation (for MVP) - just estimates without full fork
 */
export async function quickSimulate(tx, options = {}) {
  console.log('🔬 Running quick simulation...');
  
  try {
    const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC);
    
    // Estimate gas
    const gasEstimate = await provider.estimateGas({
      from: tx.from,
      to: tx.to,
      data: tx.data || tx.input || '0x',
      value: tx.value || '0x0',
    });

    // Basic risk estimation
    const estSlippagePct = 2.0; // Placeholder for quick mode
    const estLossUsd = 10.0; // Placeholder
    const attackerProfitUsd = 5.0; // Placeholder

    return {
      success: true,
      mode: 'quick',
      estGas: Number(gasEstimate),
      estSlippagePct,
      estLossUsd,
      attackerProfitUsd,
      scenario: 'estimated',
      confidence: 0.6,
      willSucceed: true,
    };
  } catch (error) {
    console.error('Quick simulation error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if Hardhat fork simulation is available
 */
export function isHardhatAvailable() {
  // For now, we're using ethers.js with Alchemy, so always available
  return !!ALCHEMY_RPC;
}

export default {
  simulateSandwichAttack,
  quickSimulate,
  isHardhatAvailable,
};
