# 🔬 Transaction Simulation Module

This module enables real-time transaction simulation using Tenderly API to compute accurate slippage and estimated losses for flagged transactions.

## 📋 Features

- ✅ **Tenderly Integration**: Simulate transactions using Tenderly's fork simulation
- ✅ **Slippage Calculation**: Compute exact slippage percentage 
- ✅ **Loss Estimation**: Calculate estimated USD loss for victims
- ✅ **Background Processing**: Optional BullMQ queue for non-blocking simulations
- ✅ **API Endpoints**: REST API for on-demand simulation
- ✅ **Database Integration**: Automatic alert updates with simulation results

## 🚀 Quick Start

### 1. Environment Setup

Ensure `.env` has Tenderly credentials:

```env
TENDERLY_ACCOUNT=Chirag_21
TENDERLY_PROJECT=protego
TENDERLY_ACCESS_KEY=tU3QzZ2rug9molS2oRj16L21NACo7Vkb
REDIS_URL=redis://127.0.0.1:6379
```

### 2. Test Simulation

Run the test script to verify setup:

```bash
cd backend
node scripts/test-simulation.js
```

Expected output:
```
✅ All tests passed! Simulation module is ready.
```

### 3. Start Backend

```bash
node server.js
```

Backend will start on port 8080 with simulation endpoints available at `/api/simulate`.

## 🔌 API Endpoints

### POST `/api/simulate`

Simulate a single transaction.

**Request Body:**
```json
{
  "tx": {
    "from": "0x...",
    "to": "0x...",
    "data": "0x...",
    "value": "0x0",
    "gas": "8000000",
    "gasPrice": "0x...",
    "networkId": "1"
  },
  "txHash": "0x...",
  "victimAddress": "0x...",
  "tokenAddress": "0x...",
  "baselineTokenOutWei": "1000000000000000000",
  "tokenDecimals": 18,
  "tokenUsdPrice": 2500
}
```

**Response:**
```json
{
  "ok": true,
  "slippagePct": 2.5,
  "estLossUsd": 62.5,
  "explorerUrl": "https://dashboard.tenderly.co/...",
  "tokenOut": "975000000000000000",
  "transfers": [...],
  "gasUsed": 150000,
  "status": true
}
```

### POST `/api/simulate/batch`

Simulate multiple transactions (for sandwich attack analysis).

**Request Body:**
```json
{
  "transactions": [
    {
      "tx": {...},
      "txHash": "0x...",
      "victimAddress": "0x...",
      "tokenAddress": "0x..."
    },
    ...
  ]
}
```

### GET `/api/simulate/status/:txHash`

Check simulation status for a transaction.

**Response:**
```json
{
  "ok": true,
  "tx_hash": "0x...",
  "sim_status": "done",
  "slippage_pct": 2.5,
  "est_loss_usd": 62.5,
  "sim_url": "https://dashboard.tenderly.co/..."
}
```

## 🔄 Background Queue (Optional)

### Start Worker

```bash
node queue/simWorker.js
```

### Enqueue Job

```javascript
import { enqueueSimulation } from './queue/simQueue.js';

await enqueueSimulation({
  tx: {...},
  txHash: '0x...',
  victimAddress: '0x...',
  tokenAddress: '0x...',
  baselineTokenOutWei: '1000000000000000000',
  tokenDecimals: 18,
  tokenUsdPrice: 2500
});
```

## 📊 Database Schema

The `alerts` table includes simulation fields:

```sql
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS sim_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS sim_url TEXT;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS raw_sim JSONB;
```

Possible `sim_status` values:
- `pending`: Simulation not yet run
- `done`: Simulation completed successfully
- `failed`: Simulation failed

## 🧪 Testing with cURL

```bash
# Test simulation endpoint
curl -X POST http://localhost:8080/api/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "tx": {
      "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "to": "0x0000000000000000000000000000000000000000",
      "data": "0x",
      "value": "0x1000000000000000",
      "gas": "21000",
      "gasPrice": "0x3b9aca00",
      "networkId": "1"
    }
  }'
```

## 🔗 Integration with Detector

To automatically simulate flagged transactions:

```javascript
import { enqueueSimulation } from './queue/simQueue.js';

// In detector when flagging transaction
if (riskLevel >= 'MEDIUM') {
  await enqueueSimulation({
    tx: mempoolTx,
    txHash: mempoolTx.hash,
    victimAddress: mempoolTx.from,
    // ... other params
  });
}
```

## 🛠️ Module Structure

```
backend/
├── sim/
│   ├── tenderlyClient.js      # Tenderly API client
│   ├── simulateTx.js           # Transaction simulation
│   ├── analyzeSimulation.js    # Parse simulation results
│   └── metrics.js              # Calculate slippage & loss
├── routes/
│   └── simulateRoute.js        # API endpoints
├── queue/
│   ├── simQueue.js             # Queue manager
│   └── simWorker.js            # Background worker
├── utils/
│   └── alerts.js               # Database helpers
└── scripts/
    └── test-simulation.js      # Test script
```

## 🎯 Next Steps

1. ✅ Setup complete
2. 🔄 Integrate with detector to auto-simulate flagged transactions
3. 🎨 Add "Re-simulate" button in frontend
4. 📊 Display real slippage % and loss USD in alert cards
5. 🔬 Implement Hardhat fork simulation as fallback

## 📚 Resources

- [Tenderly Simulation API Docs](https://docs.tenderly.co/simulations-and-forks/simulation-api)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 🐛 Troubleshooting

### "Tenderly API key not configured"
- Check `.env` has `TENDERLY_ACCESS_KEY`
- Restart server after updating `.env`

### "Simulation failed"
- Verify Tenderly account and project names
- Check transaction data format (all fields should be hex strings)
- Review Tenderly dashboard for quota limits

### Queue jobs not processing
- Ensure Redis is running: `redis-cli ping`
- Start worker: `node queue/simWorker.js`
- Check Redis connection in logs
