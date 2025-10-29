// backend/test-enhanced-detector.js
// Test script for enhanced front-running detection with calldata decoding
import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import * as helpers from "./core/detectorHelpers.js";
import { analyzeTx } from "./core/detector.js";

const ALCHEMY_HTTP = process.env.ALCHEMY_HTTP || process.env.ALCHEMY_HTTPS;

if (!ALCHEMY_HTTP) {
  console.error("❌ ALCHEMY_HTTP or ALCHEMY_HTTPS must be set in .env");
  process.exit(1);
}

// Test cases with real Uniswap V2 router transactions
const TEST_CASES = [
  {
    name: "Real Uniswap V2 swap (WETH → USDC)",
    // This is a mock transaction based on typical Uniswap V2 swap
    tx: {
      hash: "0xtest123456789abcdef",
      from: "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
      to: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
      gasPrice: "50000000000", // 50 Gwei
      value: "0",
      // swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline)
      // Example: swap 1 WETH for USDC
      data: "0x38ed1739" + // function selector for swapExactTokensForTokens
            "0000000000000000000000000000000000000000000000000de0b6b3a7640000" + // amountIn: 1 WETH (1e18)
            "0000000000000000000000000000000000000000000000000000000000000000" + // amountOutMin: 0 (for testing)
            "00000000000000000000000000000000000000000000000000000000000000a0" + // path offset
            "000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb" + // to address
            "0000000000000000000000000000000000000000000000000000000067890123" + // deadline
            "0000000000000000000000000000000000000000000000000000000000000002" + // path length
            "000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" + // WETH
            "000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"  // USDC
    }
  },
  {
    name: "Large trade (potential front-run target)",
    tx: {
      hash: "0xtest987654321fedcba",
      from: "0x8888888888888888888888888888888888888888",
      to: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
      gasPrice: "150000000000", // 150 Gwei (high gas = potential front-run)
      value: "0",
      data: "0x38ed1739" +
            "0000000000000000000000000000000000000000000000056bc75e2d63100000" + // 100 WETH
            "0000000000000000000000000000000000000000000000000000000000000000" +
            "00000000000000000000000000000000000000000000000000000000000000a0" +
            "0000000000000000008888888888888888888888888888888888888888888888" +
            "0000000000000000000000000000000000000000000000000000000067890123" +
            "0000000000000000000000000000000000000000000000000000000000000002" +
            "000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" +
            "000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    }
  }
];

async function testCallDataDecoding() {
  console.log("\n=== TEST 1: Calldata Decoding ===\n");
  
  for (const testCase of TEST_CASES) {
    console.log(`📝 ${testCase.name}`);
    const decoded = helpers.decodeRouterInput(testCase.tx.data);
    
    if (decoded) {
      console.log(`  ✅ Decoded successfully`);
      console.log(`     Method: ${decoded.method}`);
      console.log(`     Path: ${decoded.path.map(p => p.slice(0, 8) + "...").join(" → ")}`);
      if (decoded.amountIn) {
        console.log(`     Amount In: ${ethers.formatEther(decoded.amountIn)} tokens`);
      }
      if (decoded.amountOut) {
        console.log(`     Amount Out Min: ${ethers.formatEther(decoded.amountOut)} tokens`);
      }
    } else {
      console.log(`  ❌ Failed to decode`);
    }
    console.log();
  }
}

async function testPairReserveFetching() {
  console.log("\n=== TEST 2: Fetching Pair Reserves ===\n");
  
  const provider = new ethers.JsonRpcProvider(ALCHEMY_HTTP);
  
  // WETH/USDC pair
  const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
  const FACTORY = helpers.KNOWN_FACTORIES.uniswapV2;
  
  console.log(`🔍 Looking up WETH/USDC pair...`);
  console.log(`   Factory: ${FACTORY}`);
  
  try {
    const pairAddress = await helpers.getPairAddress(provider, FACTORY, WETH, USDC);
    
    if (pairAddress) {
      console.log(`  ✅ Pair found: ${pairAddress}`);
      
      const reserves = await helpers.getReservesForTokens(provider, pairAddress, WETH, USDC);
      
      if (reserves) {
        console.log(`  📊 Reserves:`);
        console.log(`     WETH (in):  ${ethers.formatEther(reserves.reserveIn)} tokens`);
        console.log(`     USDC (out): ${ethers.formatUnits(reserves.reserveOut, 6)} tokens`);
        console.log(`     Token0: ${reserves.token0.slice(0, 10)}...`);
        console.log(`     Token1: ${reserves.token1.slice(0, 10)}...`);
      } else {
        console.log(`  ❌ Failed to fetch reserves`);
      }
    } else {
      console.log(`  ❌ Pair not found`);
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
  }
  
  console.log();
}

async function testPriceImpactCalculation() {
  console.log("\n=== TEST 3: Price Impact Calculation ===\n");
  
  // Mock reserves (WETH/USDC pool)
  const reserveWETH = ethers.parseEther("1000"); // 1000 WETH
  const reserveUSDC = ethers.parseUnits("3000000", 6); // 3M USDC
  
  const testTrades = [
    { amount: ethers.parseEther("0.1"), label: "Small trade (0.1 WETH)" },
    { amount: ethers.parseEther("1"), label: "Medium trade (1 WETH)" },
    { amount: ethers.parseEther("10"), label: "Large trade (10 WETH)" },
    { amount: ethers.parseEther("50"), label: "Very large trade (50 WETH)" }
  ];
  
  for (const trade of testTrades) {
    const impact = helpers.computeImpact(trade.amount, reserveWETH, reserveUSDC);
    
    console.log(`📊 ${trade.label}`);
    console.log(`   Price Impact: ${impact.priceImpactPct.toFixed(3)}%`);
    console.log(`   Relative Size: ${impact.relativeSizePct.toFixed(3)}% of liquidity`);
    console.log(`   Amount Out: ${ethers.formatUnits(impact.amountOut, 6)} USDC`);
    
    // Flag if exceeds thresholds
    if (impact.relativeSizePct > 0.5) {
      console.log(`   ⚠️ ALERT: Large relative size (> 0.5%)`);
    }
    if (impact.priceImpactPct > 1.0) {
      console.log(`   🚨 ALERT: High price impact (> 1.0%)`);
    }
    console.log();
  }
}

async function testEnhancedDetection() {
  console.log("\n=== TEST 4: Full Enhanced Detection Pipeline ===\n");
  
  const provider = new ethers.JsonRpcProvider(ALCHEMY_HTTP);
  
  // Create a mock transaction with real router address
  const mockTx = {
    hash: "0xmock_enhanced_test",
    from: "0x1234567890123456789012345678901234567890",
    to: "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
    gasPrice: ethers.parseUnits("100", "gwei").toString(),
    value: "0",
    // Swap 5 WETH for USDC
    data: "0x38ed1739" +
          "0000000000000000000000000000000000000000000000004563918244f40000" + // 5 WETH
          "0000000000000000000000000000000000000000000000000000000000000000" +
          "00000000000000000000000000000000000000000000000000000000000000a0" +
          "0000000000000000001234567890123456789012345678901234567890123456" +
          "0000000000000000000000000000000000000000000000000000000067890123" +
          "0000000000000000000000000000000000000000000000000000000000000002" +
          "000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" +
          "000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  };
  
  console.log(`🧪 Testing enhanced detection on mock transaction...`);
  console.log(`   TX Hash: ${mockTx.hash}`);
  console.log(`   Router: ${mockTx.to}`);
  
  try {
    const result = await analyzeTx(mockTx, provider, helpers.KNOWN_FACTORIES.uniswapV2);
    
    console.log(`\n📊 Detection Results:`);
    console.log(`   Risk Level: ${result.riskLevel}`);
    console.log(`   Confidence: ${result.confidence}%`);
    console.log(`   Rules Triggered: ${result.rules.join(", ") || "None"}`);
    console.log(`   Estimated Loss: $${result.estLossUsd.toFixed(2)}`);
    console.log(`   Slippage: ${result.slippagePct.toFixed(3)}%`);
    
    if (result.enhancedData) {
      console.log(`\n🔬 Enhanced Data:`);
      console.log(`   Method: ${result.enhancedData.method}`);
      console.log(`   Token In: ${result.enhancedData.tokenIn.slice(0, 10)}...`);
      console.log(`   Token Out: ${result.enhancedData.tokenOut.slice(0, 10)}...`);
      console.log(`   Amount In: ${ethers.formatEther(result.enhancedData.amountIn)} tokens`);
      console.log(`   Price Impact: ${result.enhancedData.priceImpactPct.toFixed(3)}%`);
      console.log(`   Relative Size: ${result.enhancedData.relativeSizePct.toFixed(3)}%`);
      console.log(`   Reserve In: ${ethers.formatEther(result.enhancedData.reserveIn)} tokens`);
      console.log(`   Reserve Out: ${ethers.formatUnits(result.enhancedData.reserveOut, 6)} tokens`);
    } else {
      console.log(`\n⚠️ Enhanced data not available (may be using fallback detection)`);
    }
    
    // Check if alert would be stored
    if (result.confidence >= 70) {
      console.log(`\n✅ This alert WOULD BE STORED (confidence >= 70%)`);
    } else {
      console.log(`\n❌ This alert would NOT be stored (confidence < 70%)`);
    }
  } catch (error) {
    console.error(`❌ Error during detection: ${error.message}`);
  }
  
  console.log();
}

async function runAllTests() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  Enhanced Front-Running Detector - Test Suite             ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  
  try {
    // Test 1: Calldata decoding
    await testCallDataDecoding();
    
    // Test 2: Pair reserve fetching (requires RPC)
    await testPairReserveFetching();
    
    // Test 3: Price impact calculation
    await testPriceImpactCalculation();
    
    // Test 4: Full enhanced detection
    await testEnhancedDetection();
    
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║  All Tests Complete!                                       ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");
  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
    console.error(error.stack);
  }
  
  process.exit(0);
}

runAllTests();
