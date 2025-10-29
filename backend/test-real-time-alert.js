// Test script to emit real-time alerts
// This simulates the mempool listener emitting alerts to connected frontends
// Run this while your dashboard is open to test real-time functionality

import { Server as IOServer } from "socket.io";
import http from "http";

const httpServer = http.createServer();
const io = new IOServer(httpServer, {
  cors: { origin: true }
});

const riskLevels = ['HIGH', 'MEDIUM', 'SAFE'];
const rules = [
  ['frontrun', 'high_gas'],
  ['sandwich', 'large_tx'],
  ['price_manipulation', 'slippage'],
  ['mev_detected', 'suspicious_timing'],
  ['high_slippage', 'liquidity_drain'],
  ['flash_loan_attack', 'reentrancy'],
  ['unusual_pattern', 'multi_hop']
];

// Common DeFi contract addresses for variety
const targetContracts = [
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
  '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
  '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap Router
  '0x1111111254fb6c44bAC0beD2854e76F90643097d', // 1inch Router
  '0xDef1C0ded9bec7F1a1670819833240f027b25EfF'  // 0x Exchange Proxy
];

function generateRandomAlert() {
  const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
  const ruleSet = rules[Math.floor(Math.random() * rules.length)];
  const targetContract = targetContracts[Math.floor(Math.random() * targetContracts.length)];
  
  // Generate unique transaction hash
  const timestamp = Date.now();
  const randomPart = Math.random().toString(16).substr(2);
  const uniqueHash = '0x' + timestamp.toString(16) + randomPart + Array.from({ length: 48 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('').substr(0, 48);
  
  // Generate unique confidence based on hash (deterministic per transaction)
  // Use last 4 chars of hash to generate a number between 70-99
  const hashSeed = parseInt(uniqueHash.slice(-4), 16);
  const uniqueConfidence = 70 + (hashSeed % 30); // 70-99
  
  // Generate unique estimated loss based on hash and risk level
  // Higher risk = potentially higher loss
  let lossMultiplier;
  if (riskLevel === 'HIGH') {
    lossMultiplier = 1000 + (hashSeed % 9000); // $1000-$10,000
  } else if (riskLevel === 'MEDIUM') {
    lossMultiplier = 200 + (hashSeed % 1800); // $200-$2,000
  } else {
    lossMultiplier = 10 + (hashSeed % 490); // $10-$500
  }
  const uniqueLoss = (lossMultiplier + (hashSeed % 100)).toFixed(2);
  
  // Generate unique slippage (1-15%)
  const uniqueSlippage = (1 + (hashSeed % 140) / 10).toFixed(2);
  
  return {
    id: Math.floor(Math.random() * 100000) + timestamp,
    tx_hash: uniqueHash,
    from: '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join(''),
    to: targetContract,
    risk_level: riskLevel,
    confidence: uniqueConfidence,
    est_loss_usd: uniqueLoss,
    slippage_pct: uniqueSlippage,
    created_at: new Date().toISOString(),
    rules: ruleSet,
    payload: {
      value: '0x' + Math.floor(Math.random() * 1000000).toString(16),
      gasPrice: '0x' + Math.floor(Math.random() * 100000000000).toString(16),
      data: '0x38ed1739...'
    },
    sim_status: Math.random() > 0.5 ? 'done' : 'pending'
  };
}

let alertCount = 0;

httpServer.listen(4000, () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     🧪 Protego Real-Time Alert Test Server               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('✅ Test server running on port 4000');
  console.log('📡 Emitting test alerts every 5 seconds');
  console.log('');
  console.log('Open your dashboard at: http://localhost:3000/dashboard');
  console.log('Watch for alerts appearing in real-time!');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('─────────────────────────────────────────────────────────────');
  
  // Emit initial alert immediately
  setTimeout(() => {
    const alert = generateRandomAlert();
    alertCount++;
    console.log(`\n📤 [${alertCount}] Emitting ${alert.risk_level} alert`);
    console.log(`   TX: ${alert.tx_hash.slice(0, 16)}...`);
    console.log(`   Confidence: ${alert.confidence}%`);
    console.log(`   Est. Loss: $${alert.est_loss_usd}`);
    io.emit('new_alert', alert);
  }, 2000);
  
  // Then emit every 5 seconds
  setInterval(() => {
    const alert = generateRandomAlert();
    alertCount++;
    console.log(`\n📤 [${alertCount}] Emitting ${alert.risk_level} alert`);
    console.log(`   TX: ${alert.tx_hash.slice(0, 16)}...`);
    console.log(`   Confidence: ${alert.confidence}%`);
    console.log(`   Est. Loss: $${alert.est_loss_usd}`);
    io.emit('new_alert', alert);
  }, 5000);
});

io.on('connection', (socket) => {
  console.log('\n🟢 Frontend connected! (Dashboard is listening)');
  
  socket.on('disconnect', () => {
    console.log('\n🔴 Frontend disconnected');
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✨ Test complete!');
  console.log(`📊 Total alerts emitted: ${alertCount}`);
  console.log('Goodbye! 👋\n');
  process.exit(0);
});
