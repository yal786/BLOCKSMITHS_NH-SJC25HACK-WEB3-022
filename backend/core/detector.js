// backend/core/detector.js
// Enhanced rule-based detector for Protego
import * as helpers from "./detectorHelpers.js";

const KNOWN_ROUTERS = new Set([
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // uniswap v2 router (mainnet)
  "0xe592427a0aece92de3edee1f18e0157c05861564", // uniswap v3 router
  "0x10ed43c718714eb63d5aa57b78b54704e256024e", // pancakeswap router v2 (BSC)
  // add other routers here (lowercase)
]);

// Configuration thresholds
const THRESHOLDS = {
  largeRelativeSize: 0.5, // 0.5% of pool liquidity
  highPriceImpact: 1.0,   // 1% price impact
  gasSpikeMultiplier: 1.6, // 1.6x median gas
  sandwichWindowMs: 30000  // 30 seconds for sandwich detection
};

// Gas tracking for spike detection
const recentGas = [];
function pushGas(n) {
  const num = Number(n) || 0;
  recentGas.push(num);
  if (recentGas.length > 500) recentGas.shift();
}
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a,b)=>a-b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2;
}

// Recent transactions buffer for sandwich detection (buy → victim → sell pattern)
const recentTxBuffer = [];
const MAX_BUFFER_SIZE = 1000;

function addToBuffer(txData) {
  recentTxBuffer.push({
    ...txData,
    timestamp: Date.now()
  });
  if (recentTxBuffer.length > MAX_BUFFER_SIZE) {
    recentTxBuffer.shift();
  }
}

function cleanOldBufferEntries(windowMs) {
  const cutoff = Date.now() - windowMs;
  while (recentTxBuffer.length > 0 && recentTxBuffer[0].timestamp < cutoff) {
    recentTxBuffer.shift();
  }
}

/**
 * Detect sandwich attack pattern: buy → victim → sell
 * Looks for same attacker doing buy-then-sell around victim tx with same token pair
 */
function detectSandwichPattern(currentTx, enhancedData) {
  if (!enhancedData || !enhancedData.tokenIn || !enhancedData.tokenOut) {
    return false;
  }
  
  cleanOldBufferEntries(THRESHOLDS.sandwichWindowMs);
  
  const tokenPair = [enhancedData.tokenIn, enhancedData.tokenOut].sort().join("-");
  const from = currentTx.from.toLowerCase();
  
  // Look for potential frontrun (attacker buys same pair recently)
  const potentialFrontrun = recentTxBuffer.find(tx => {
    if (!tx.enhancedData) return false;
    const txPair = [tx.enhancedData.tokenIn, tx.enhancedData.tokenOut].sort().join("-");
    // Same pair, different sender (potential attacker), buying the out token
    return txPair === tokenPair && 
           tx.from !== from &&
           tx.enhancedData.tokenIn === enhancedData.tokenOut; // Attacker buys what victim will buy
  });
  
  if (potentialFrontrun) {
    // Found potential frontrun - current tx could be victim
    // Look for backrun (attacker sells right after)
    const potentialBackrun = recentTxBuffer.find(tx => {
      if (!tx.enhancedData) return false;
      const txPair = [tx.enhancedData.tokenIn, tx.enhancedData.tokenOut].sort().join("-");
      return txPair === tokenPair &&
             tx.from === potentialFrontrun.from && // Same attacker
             tx.enhancedData.tokenOut === enhancedData.tokenIn && // Attacker sells what victim bought
             tx.timestamp > potentialFrontrun.timestamp;
    });
    
    if (potentialBackrun) {
      return true; // Full sandwich detected
    }
  }
  
  return false;
}

/**
 * Basic analyzer (legacy) - for txs without enhanced data
 */
export function analyzeTxBasic(tx) {
  const to = (tx.to || "").toLowerCase();
  const from = (tx.from || "").toLowerCase();

  let gp = null;
  if (tx.gasPrice != null) {
    try {
      gp = Number(tx.gasPrice.toString ? tx.gasPrice.toString() : tx.gasPrice);
    } catch (e) {
      gp = Number(tx.gasPrice);
    }
    if (!Number.isNaN(gp)) pushGas(gp);
  }

  const rules = [];
  let riskLevel = "LOW";
  let confidence = 10;

  if (KNOWN_ROUTERS.has(to)) {
    rules.push("isDexRouter");
    riskLevel = "MEDIUM";
    confidence += 30;
  }

  if (gp) {
    const med = median(recentGas) || gp;
    if (gp > med * THRESHOLDS.gasSpikeMultiplier) {
      rules.push("gasPriceSpike");
      if (riskLevel === "MEDIUM") riskLevel = "HIGH";
      else riskLevel = "HIGH";
      confidence += 45;
    }
  }

  const estLossUsd = rules.includes("gasPriceSpike") ? 10.0 : (rules.includes("isDexRouter") ? 2.5 : 0.0);
  const slippagePct = rules.includes("gasPriceSpike") ? 1.8 : (rules.includes("isDexRouter") ? 0.4 : 0.0);

  return {
    txHash: tx.hash,
    from,
    to,
    riskLevel,
    confidence: Math.min(confidence, 95),
    rules,
    estLossUsd,
    slippagePct,
    payload: tx
  };
}

/**
 * Enhanced analyzer with on-chain data (calldata decoding + reserves + impact)
 * This is async because it makes RPC calls
 */
export async function analyzeTxEnhanced(tx, provider, factoryAddress) {
  const to = (tx.to || "").toLowerCase();
  const from = (tx.from || "").toLowerCase();

  // Track gas
  let gp = null;
  if (tx.gasPrice != null) {
    try {
      gp = Number(tx.gasPrice.toString ? tx.gasPrice.toString() : tx.gasPrice);
    } catch (e) {
      gp = Number(tx.gasPrice);
    }
    if (!Number.isNaN(gp)) pushGas(gp);
  }

  const rules = [];
  let riskLevel = "LOW";
  let confidence = 10;
  let enhancedData = null;

  // Rule: isDexRouter
  if (KNOWN_ROUTERS.has(to)) {
    rules.push("isDexRouter");
    riskLevel = "MEDIUM";
    confidence += 30;

    // Try to get enhanced data (decode calldata + fetch reserves)
    try {
      enhancedData = await helpers.analyzeTx(provider, tx, factoryAddress);
      
      if (enhancedData) {
        // Rule: largeRelativeSize (trade size > threshold% of liquidity)
        if (enhancedData.relativeSizePct > THRESHOLDS.largeRelativeSize) {
          rules.push("largeRelativeSize");
          confidence += 25;
          if (riskLevel === "MEDIUM") riskLevel = "HIGH";
        }

        // Rule: highPriceImpact
        if (enhancedData.priceImpactPct > THRESHOLDS.highPriceImpact) {
          rules.push("highPriceImpact");
          confidence += 20;
          riskLevel = "HIGH";
        }

        // Rule: correlatedSequence (sandwich attack pattern)
        const isSandwich = detectSandwichPattern(tx, enhancedData);
        if (isSandwich) {
          rules.push("correlatedSequence");
          confidence += 30;
          riskLevel = "HIGH";
        }
      }
    } catch (err) {
      console.error("Enhanced analysis failed:", err.message);
    }
  }

  // Rule: gasPriceSpike
  if (gp) {
    const med = median(recentGas) || gp;
    if (gp > med * THRESHOLDS.gasSpikeMultiplier) {
      rules.push("gasPriceSpike");
      confidence += 45;
      riskLevel = "HIGH";
    }
  }

  // Calculate estimates
  let estLossUsd = 0;
  let slippagePct = 0;

  if (enhancedData) {
    // Use actual price impact for slippage
    slippagePct = enhancedData.priceImpactPct;
    
    // Estimate loss based on impact and trade size
    // This is a rough estimate - in production you'd want token prices
    if (enhancedData.priceImpactPct > 1) {
      estLossUsd = enhancedData.priceImpactPct * 5; // Rough heuristic
    }
  } else {
    // Fallback to basic estimates
    estLossUsd = rules.includes("gasPriceSpike") ? 10.0 : (rules.includes("isDexRouter") ? 2.5 : 0.0);
    slippagePct = rules.includes("gasPriceSpike") ? 1.8 : (rules.includes("isDexRouter") ? 0.4 : 0.0);
  }

  // Add to buffer for sandwich detection
  addToBuffer({
    hash: tx.hash,
    from,
    to,
    enhancedData,
    rules
  });

  // Build enhanced payload
  const payload = {
    ...tx,
    enhancedData
  };

  return {
    txHash: tx.hash,
    from,
    to,
    riskLevel,
    confidence: Math.min(confidence, 100),
    rules,
    estLossUsd,
    slippagePct,
    payload,
    enhancedData
  };
}

/**
 * Main analyzer - routes to enhanced or basic based on parameters
 */
export async function analyzeTx(tx, provider = null, factoryAddress = null) {
  if (provider && KNOWN_ROUTERS.has((tx.to || "").toLowerCase())) {
    return await analyzeTxEnhanced(tx, provider, factoryAddress || helpers.KNOWN_FACTORIES.uniswapV2);
  }
  return analyzeTxBasic(tx);
}

/**
 * Small test helper for local dev — returns array of results for fake txs
 */
export function runDetectorTests() {
  const fakeTxs = [
    { hash: "0x1", from: "0xaaa", to: "0x7a250d5630b4cf539739df2c5dacab7dbe2f6d", gasPrice: 100, data: "0x" },
    { hash: "0x2", from: "0xbbb", to: "0x1234567890123456789012345678901234567890", gasPrice: 300, data: "0x" },
    { hash: "0x3", from: "0xccc", to: "0x7a250d5630b4cf539739df2c5dacab7dbe2f6d", gasPrice: 1000, data: "0x" },
  ];
  return fakeTxs.map(tx => analyzeTx(tx));
}
