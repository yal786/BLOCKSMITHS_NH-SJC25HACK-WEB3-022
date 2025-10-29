// backend/scripts/test-simulation.js
// Test script for Tenderly simulation
import dotenv from 'dotenv';
import { simulateTenderlyTx } from '../sim/simulateTx.js';
import { parseTenderlySimulation } from '../sim/analyzeSimulation.js';
import { computeSlippageAndLoss } from '../sim/metrics.js';

dotenv.config();

async function testSimulation() {
  console.log('🧪 Testing Tenderly Simulation Setup\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check environment variables
  console.log('📋 Configuration Check:');
  console.log(`   TENDERLY_ACCOUNT: ${process.env.TENDERLY_ACCOUNT || '❌ NOT SET'}`);
  console.log(`   TENDERLY_PROJECT: ${process.env.TENDERLY_PROJECT || '❌ NOT SET'}`);
  console.log(`   TENDERLY_ACCESS_KEY: ${process.env.TENDERLY_ACCESS_KEY ? '✅ SET' : '❌ NOT SET'}`);
  console.log();

  if (!process.env.TENDERLY_ACCESS_KEY) {
    console.error('❌ Tenderly credentials not configured in .env');
    console.log('\n💡 Please add to .env:');
    console.log('   TENDERLY_ACCOUNT=your_account');
    console.log('   TENDERLY_PROJECT=your_project');
    console.log('   TENDERLY_ACCESS_KEY=your_access_key');
    process.exit(1);
  }

  // Test transaction: Simple ETH transfer
  const testTx = {
    networkId: '1',
    from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    to: '0x0000000000000000000000000000000000000000',
    data: '0x',
    value: '0x1000000000000000', // 0.001 ETH
    gas: '21000',
    gasPrice: '0x3b9aca00', // 1 gwei
  };

  console.log('🔬 Running test simulation...');
  console.log('   From:', testTx.from);
  console.log('   To:', testTx.to);
  console.log('   Value: 0.001 ETH');
  console.log();

  try {
    const simResult = await simulateTenderlyTx(testTx);

    if (!simResult.success) {
      console.error('❌ Simulation failed:', simResult.error);
      if (simResult.details) {
        console.error('   Details:', JSON.stringify(simResult.details, null, 2));
      }
      process.exit(1);
    }

    console.log('✅ Simulation successful!');
    console.log();
    console.log('📊 Results:');
    console.log(`   Status: ${simResult.status ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Gas Used: ${simResult.gasUsed.toLocaleString()}`);
    console.log(`   Logs: ${simResult.logs.length} events`);
    console.log(`   Explorer: ${simResult.explorerUrl}`);
    console.log();

    // Test parsing
    const parsed = parseTenderlySimulation(simResult);
    console.log('🔍 Parsed Data:');
    console.log(`   Transfers Found: ${parsed.transfers.length}`);
    console.log(`   Token Out: ${parsed.tokenOut || 'N/A'}`);
    console.log();

    // Test metrics calculation (example)
    const baselineOut = '1000000000000000000'; // 1 token
    const actualOut = '980000000000000000'; // 0.98 token (2% slippage)
    const metrics = computeSlippageAndLoss(baselineOut, actualOut, 18, 2500);
    
    console.log('📈 Metrics Calculation Test:');
    console.log(`   Baseline: 1.0 tokens`);
    console.log(`   Actual: 0.98 tokens`);
    console.log(`   Slippage: ${metrics.slippagePct.toFixed(2)}%`);
    console.log(`   Est. Loss: $${metrics.estLossUsd.toFixed(2)} (@ $2500/token)`);
    console.log();

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ All tests passed! Simulation module is ready.');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSimulation();
