// backend/core/detectorHelpers.js
// Helper functions for enhanced front-running detection
import { ethers } from "ethers";

// Uniswap V2 Router ABI - key functions for decoding
const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
];

// Uniswap V2 Factory ABI
const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)"
];

// Uniswap V2 Pair ABI
const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];

// Known factory addresses (lowercase)
const KNOWN_FACTORIES = {
  // Ethereum mainnet
  uniswapV2: "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f",
  sushiswap: "0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac",
  // BSC
  pancakeswap: "0xbcfccbde45ce874adcb698cc183debcf17952812"
};

/**
 * Create ethers provider from RPC URL
 */
export function makeProvider(rpcUrl) {
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Decode router calldata to extract swap method, token path, and amounts
 * Returns: { method, path, amountIn, amountOut, decoded } or null
 */
export function decodeRouterInput(inputData) {
  if (!inputData || inputData === "0x") return null;
  
  const iface = new ethers.Interface(ROUTER_ABI);
  
  try {
    const decoded = iface.parseTransaction({ data: inputData });
    if (!decoded) return null;
    
    const funcName = decoded.name;
    const args = decoded.args;
    
    let path = null;
    let amountIn = null;
    let amountOut = null;
    
    // Extract parameters based on function signature
    if (funcName === "swapExactTokensForTokens" || 
        funcName === "swapExactTokensForETH" ||
        funcName === "swapExactETHForTokens") {
      // swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)
      amountIn = args[0];
      amountOut = args[1]; // this is actually amountOutMin
      path = args[2];
    } else if (funcName === "swapTokensForExactTokens" || 
               funcName === "swapTokensForExactETH" ||
               funcName === "swapETHForExactTokens") {
      // swapTokensForExactTokens(amountOut, amountInMax, path, to, deadline)
      amountOut = args[0];
      amountIn = args[1]; // this is actually amountInMax
      path = args[2];
    }
    
    if (!path || path.length < 2) return null;
    
    return {
      method: funcName,
      path: path.map(addr => addr.toLowerCase()),
      amountIn: amountIn ? BigInt(amountIn.toString()) : null,
      amountOut: amountOut ? BigInt(amountOut.toString()) : null,
      decoded
    };
  } catch (error) {
    // Not a router swap or unsupported function
    return null;
  }
}

/**
 * Get pair address from factory
 */
export async function getPairAddress(provider, factoryAddress, tokenA, tokenB) {
  try {
    const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
    const pairAddr = await factory.getPair(tokenA, tokenB);
    if (pairAddr === ethers.ZeroAddress) return null;
    return pairAddr.toLowerCase();
  } catch (error) {
    console.error("getPairAddress error:", error.message);
    return null;
  }
}

/**
 * Get reserves for a token pair
 * Returns: { reserve0, reserve1, token0, token1, reserveIn, reserveOut }
 */
export async function getReservesForTokens(provider, pairAddress, tokenIn, tokenOut) {
  try {
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    
    // Get reserves and token addresses in parallel
    const [reserves, token0Addr, token1Addr] = await Promise.all([
      pair.getReserves(),
      pair.token0(),
      pair.token1()
    ]);
    
    const token0 = token0Addr.toLowerCase();
    const token1 = token1Addr.toLowerCase();
    const reserve0 = BigInt(reserves.reserve0.toString());
    const reserve1 = BigInt(reserves.reserve1.toString());
    
    // Determine which reserve corresponds to tokenIn/tokenOut
    let reserveIn, reserveOut;
    if (tokenIn.toLowerCase() === token0) {
      reserveIn = reserve0;
      reserveOut = reserve1;
    } else if (tokenIn.toLowerCase() === token1) {
      reserveIn = reserve1;
      reserveOut = reserve0;
    } else {
      return null;
    }
    
    return {
      reserve0,
      reserve1,
      token0,
      token1,
      reserveIn,
      reserveOut
    };
  } catch (error) {
    console.error("getReservesForTokens error:", error.message);
    return null;
  }
}

/**
 * Calculate price impact using constant product formula (x * y = k)
 * Returns: { priceImpactPct, relativeSizePct, amountOut }
 */
export function computeImpact(amountIn, reserveIn, reserveOut) {
  try {
    const amountInBN = BigInt(amountIn.toString());
    const reserveInBN = BigInt(reserveIn.toString());
    const reserveOutBN = BigInt(reserveOut.toString());
    
    if (reserveInBN === 0n || reserveOutBN === 0n) {
      return { priceImpactPct: 0, relativeSizePct: 0, amountOut: 0n };
    }
    
    // Constant product formula with 0.3% fee
    // amountInWithFee = amountIn * 997
    // amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee)
    const amountInWithFee = amountInBN * 997n;
    const numerator = amountInWithFee * reserveOutBN;
    const denominator = (reserveInBN * 1000n) + amountInWithFee;
    const amountOut = numerator / denominator;
    
    // Price before trade: reserveOut / reserveIn
    // Price after trade: (reserveOut - amountOut) / (reserveIn + amountIn)
    // Price impact = |priceAfter - priceBefore| / priceBefore
    
    // To avoid floating point, compute in basis points (1 bp = 0.01%)
    // impact% = 100 * (1 - (reserveOut - amountOut) * reserveIn / (reserveOut * (reserveIn + amountIn)))
    
    const newReserveIn = reserveInBN + amountInBN;
    const newReserveOut = reserveOutBN - amountOut;
    
    // Calculate price impact percentage (scaled by 10000 for precision)
    const priceBeforeScaled = (reserveOutBN * 10000n) / reserveInBN;
    const priceAfterScaled = newReserveOut > 0n ? (newReserveOut * 10000n) / newReserveIn : 0n;
    const impactScaled = priceBeforeScaled > 0n ? 
      ((priceBeforeScaled - priceAfterScaled) * 10000n) / priceBeforeScaled : 0n;
    const priceImpactPct = Number(impactScaled) / 100; // Convert to percentage
    
    // Relative size: amountIn / reserveIn * 100
    const relativeSizeScaled = (amountInBN * 10000n) / reserveInBN;
    const relativeSizePct = Number(relativeSizeScaled) / 100;
    
    return {
      priceImpactPct: Math.abs(priceImpactPct),
      relativeSizePct,
      amountOut
    };
  } catch (error) {
    console.error("computeImpact error:", error.message);
    return { priceImpactPct: 0, relativeSizePct: 0, amountOut: 0n };
  }
}

/**
 * Main analysis function - decodes tx, fetches reserves, calculates impact
 * Returns enhanced analysis data or null
 */
export async function analyzeTx(provider, tx, factoryAddress = KNOWN_FACTORIES.uniswapV2) {
  try {
    // Decode calldata
    const decoded = decodeRouterInput(tx.data);
    if (!decoded || !decoded.path || decoded.path.length < 2) {
      return null;
    }
    
    const tokenIn = decoded.path[0];
    const tokenOut = decoded.path[decoded.path.length - 1];
    const amountIn = decoded.amountIn;
    
    if (!amountIn || amountIn === 0n) {
      return null;
    }
    
    // Get pair address
    const pairAddress = await getPairAddress(provider, factoryAddress, tokenIn, tokenOut);
    if (!pairAddress) {
      return null;
    }
    
    // Get reserves
    const reserves = await getReservesForTokens(provider, pairAddress, tokenIn, tokenOut);
    if (!reserves) {
      return null;
    }
    
    // Calculate impact
    const impact = computeImpact(amountIn, reserves.reserveIn, reserves.reserveOut);
    
    return {
      method: decoded.method,
      tokenIn,
      tokenOut,
      path: decoded.path,
      amountIn: amountIn.toString(),
      amountOut: impact.amountOut.toString(),
      pairAddress,
      reserveIn: reserves.reserveIn.toString(),
      reserveOut: reserves.reserveOut.toString(),
      priceImpactPct: impact.priceImpactPct,
      relativeSizePct: impact.relativeSizePct
    };
  } catch (error) {
    console.error("analyzeTx error:", error.message);
    return null;
  }
}

// Export known factories for use in detector
export { KNOWN_FACTORIES };
