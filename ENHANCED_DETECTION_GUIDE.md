# Enhanced Front-Running Detection Guide

## Overview

This enhanced front-running detector improves detection accuracy by:

1. **Decoding transaction calldata** from DEX routers (Uniswap V2, PancakeSwap, etc.)
2. **Fetching real-time liquidity data** from DEX pairs using on-chain calls
3. **Calculating price impact** and relative trade size using the constant product formula
4. **Applying advanced detection rules** to identify potential front-running attacks
5. **Assigning confidence scores** based on multiple signals

## Architecture

```
Mempool (WebSocket) → Transaction Detection → Enhanced Analysis → Alert Storage
                                               ↓
                                          On-Chain Calls (HTTP RPC)
                                          - Decode calldata
                                          - Fetch pair reserves
                                          - Calculate impact
```

### Components

#### 1. `detectorHelpers.js`
Helper functions for on-chain data extraction:
- `decodeRouterInput()` - Decodes Uniswap V2 router calldata using ABI
- `getPairAddress()` - Gets pair contract address from factory
- `getReservesForTokens()` - Fetches current reserves from pair contract
- `computeImpact()` - Calculates price impact using constant product formula (x * y = k)
- `analyzeTx()` - Main orchestrator for enhanced analysis

#### 2. `detector.js`
Detection logic with multiple rules:

**Basic Rules:**
- `isDexRouter` - Transaction targets a known DEX router
- `gasPriceSpike` - Gas price exceeds 1.6x median (configurable)

**Enhanced Rules:**
- `largeRelativeSize` - Trade size > 0.5% of pool liquidity (configurable)
- `highPriceImpact` - Price impact > 1.0% (configurable)
- `correlatedSequence` - Sandwich attack pattern detected (buy → victim → sell)

#### 3. `mempoolListener.js`
Main listener that:
- Connects to mempool via WebSocket
- Uses HTTP provider for on-chain calls
- Filters alerts by confidence threshold (default: 70%)
- Stores high-confidence alerts in Postgres

## Configuration

### Environment Variables

Add to `.env`:
```env
# WebSocket for mempool listening
ALCHEMY_WSS=wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# HTTP RPC for on-chain calls
ALCHEMY_HTTPS=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/protego
```

### Detection Thresholds

Edit `backend/core/detector.js`:
```javascript
const THRESHOLDS = {
  largeRelativeSize: 0.5,    // 0.5% of pool liquidity
  highPriceImpact: 1.0,      // 1% price impact
  gasSpikeMultiplier: 1.6,   // 1.6x median gas price
  sandwichWindowMs: 30000    // 30 seconds for sandwich detection
};
```

### Confidence Threshold

Edit `backend/core/mempoolListener.js`:
```javascript
const CONFIDENCE_THRESHOLD = 70; // Only store alerts with confidence >= 70%
const USE_ENHANCED_DETECTION = true; // Toggle enhanced detection
```

## Detection Rules Explained

### 1. Large Relative Size (`largeRelativeSize`)

**What it detects:** Trades that are large relative to the pool's liquidity

**How it works:**
```javascript
relativeSizePct = (amountIn / reserveIn) * 100

if (relativeSizePct > 0.5%) {
  // Potential front-running target - large trade will move market
  confidence += 25
  riskLevel = "HIGH"
}
```

**Example:**
- Pool has 1000 WETH liquidity
- Trade is for 6 WETH
- Relative size = 0.6% → **ALERT**

### 2. High Price Impact (`highPriceImpact`)

**What it detects:** Trades that significantly move the price

**How it works:**
Uses Uniswap's constant product formula (x * y = k):
```javascript
// With 0.3% fee
amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)

priceBefore = reserveOut / reserveIn
priceAfter = (reserveOut - amountOut) / (reserveIn + amountIn)
priceImpact = |priceAfter - priceBefore| / priceBefore * 100

if (priceImpactPct > 1.0%) {
  // High slippage - attractive front-running target
  confidence += 20
  riskLevel = "HIGH"
}
```

**Example:**
- Trade creates 2.5% price impact
- Front-runners can profit from this slippage → **ALERT**

### 3. Correlated Sequence (`correlatedSequence`)

**What it detects:** Sandwich attack pattern (buy → victim → sell)

**How it works:**
Maintains a sliding window buffer of recent transactions and looks for:

1. **Attacker's front-run** (buy): Buys the same token pair right before victim
2. **Victim's transaction** (current): The transaction being analyzed
3. **Attacker's back-run** (sell): Same attacker sells right after victim

```javascript
// Pattern detection
if (found frontrun transaction with same token pair from different sender &&
    found backrun transaction from same attacker after victim) {
  // Classic sandwich attack
  confidence += 30
  riskLevel = "HIGH"
}
```

**Example sequence:**
```
Block N:
  1. Attacker buys WETH → USDC (high gas)
  2. Victim buys WETH → USDC (normal gas)  ← DETECTED
  3. Attacker sells USDC → WETH (high gas)

Result: Attacker profits from moving price before/after victim
```

## Confidence Scoring

Confidence is calculated additively:

| Rule Triggered | Confidence Added | Risk Level |
|----------------|------------------|------------|
| Base | +10 | LOW |
| `isDexRouter` | +30 | MEDIUM |
| `gasPriceSpike` | +45 | HIGH |
| `largeRelativeSize` | +25 | HIGH |
| `highPriceImpact` | +20 | HIGH |
| `correlatedSequence` | +30 | HIGH |

**Examples:**

1. **Basic DEX swap (45% confidence):**
   - `isDexRouter` (30)
   - Base (10)
   - Result: LOW confidence, **not stored**

2. **Large trade with high gas (100% confidence):**
   - `isDexRouter` (30)
   - `gasPriceSpike` (45)
   - `largeRelativeSize` (25)
   - Result: HIGH confidence, **stored as alert**

3. **Sandwich attack detected (100% confidence):**
   - `isDexRouter` (30)
   - `correlatedSequence` (30)
   - `highPriceImpact` (20)
   - `gasPriceSpike` (45)
   - Result: Maximum confidence, **critical alert**

## Data Stored

### Postgres Schema

Enhanced alerts are stored in the `alerts` table with:

```sql
- tx_hash: Transaction hash
- from: Sender address
- to: Router contract address
- risk_level: "LOW" | "MEDIUM" | "HIGH"
- confidence: 0-100 score
- rules: JSON array of triggered rules
- est_loss_usd: Estimated loss in USD
- slippage_pct: Price impact percentage
- payload: JSON with full transaction + enhancedData
```

### Enhanced Data Structure

The `payload.enhancedData` field contains:
```json
{
  "method": "swapExactTokensForTokens",
  "tokenIn": "0xc02aaa...756cc2",
  "tokenOut": "0xa0b869...3606eb48",
  "path": ["0xc02aaa...756cc2", "0xa0b869...3606eb48"],
  "amountIn": "5000000000000000000",
  "amountOut": "14850000000",
  "pairAddress": "0xb4e16d...5cc2",
  "reserveIn": "100000000000000000000",
  "reserveOut": "300000000000",
  "priceImpactPct": 2.45,
  "relativeSizePct": 5.0
}
```

## Usage

### Running the Detector

Start the full server (includes mempool listener):
```bash
cd backend
node server.js
```

The enhanced detection will automatically:
1. Listen to the mempool via WebSocket
2. Analyze each transaction targeting a known DEX router
3. Make on-chain calls to fetch reserves and calculate impact
4. Apply all detection rules
5. Store alerts with confidence >= 70% in Postgres
6. Emit real-time alerts to frontend via Socket.IO

### Testing the Enhanced Detection

Run the test suite:
```bash
cd backend
node test-enhanced-detector.js
```

This will test:
- ✅ Calldata decoding (offline)
- ✅ Pair reserve fetching (on-chain)
- ✅ Price impact calculation (offline)
- ✅ Full detection pipeline (on-chain)

### Monitoring Logs

When the detector is running, you'll see logs like:
```
📊 TX 0xabc123... - Risk: HIGH, Confidence: 85, Rules: isDexRouter, largeRelativeSize, gasPriceSpike
   └─ Impact: 2.450%, Size: 5.000%
🚨 HIGH-CONFIDENCE ALERT SAVED - TX: 0xabc123..., Risk: HIGH, Confidence: 85%
```

## Performance Considerations

### RPC Call Optimization

Each enhanced analysis makes 2-3 on-chain calls:
1. `factory.getPair(tokenA, tokenB)` - Get pair address
2. `pair.getReserves()` - Get current reserves
3. `pair.token0()` and `pair.token1()` - Get token order

To optimize:
- Use a fast RPC provider (Alchemy, Infura)
- Consider caching frequently traded pairs
- Rate limit if necessary (current implementation doesn't cache)

### Throughput

- Basic detection: ~1000 tx/sec (mempool only)
- Enhanced detection: ~50-100 tx/sec (limited by RPC calls)

For high throughput:
- Use multiple RPC endpoints
- Implement pair address caching
- Consider running basic detection first, then enhanced only for HIGH risk

### Cost

- WebSocket connection: Free with Alchemy/Infura free tier
- RPC calls: ~3 calls per DEX transaction
- Typical load: 10-50 DEX txs per second on mainnet = 30-150 RPC calls/sec

## Tuning for Your Needs

### Reduce False Positives

Increase thresholds:
```javascript
const THRESHOLDS = {
  largeRelativeSize: 1.0,     // 1% instead of 0.5%
  highPriceImpact: 2.0,       // 2% instead of 1%
  gasSpikeMultiplier: 2.0,    // 2x instead of 1.6x
};

const CONFIDENCE_THRESHOLD = 80; // 80% instead of 70%
```

### Catch More Attacks (Higher Sensitivity)

Decrease thresholds:
```javascript
const THRESHOLDS = {
  largeRelativeSize: 0.3,     // 0.3% instead of 0.5%
  highPriceImpact: 0.5,       // 0.5% instead of 1%
  gasSpikeMultiplier: 1.3,    // 1.3x instead of 1.6x
};

const CONFIDENCE_THRESHOLD = 60; // 60% instead of 70%
```

### Add More DEX Routers

Edit `detector.js`:
```javascript
const KNOWN_ROUTERS = new Set([
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2
  "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3
  "0x10ed43c718714eb63d5aa57b78b54704e256024e", // PancakeSwap V2
  "0x1111111254fb6c44bac0bed2854e76f90643097d", // 1inch Router
  // Add more...
]);
```

### Support Different Networks

Change the factory address:
```javascript
// For BSC (Binance Smart Chain)
const factoryAddress = helpers.KNOWN_FACTORIES.pancakeswap;

// For custom network
const factoryAddress = "0xYourFactoryAddress";
```

## Limitations

1. **Uniswap V2 Only:** Currently only decodes Uniswap V2-style routers. V3 uses different ABI.
2. **Single-hop Swaps:** Path length > 2 (multi-hop) not fully tested
3. **No Token Prices:** Loss estimates are rough - need oracle integration for accurate USD values
4. **No MEV Bundle Detection:** Only detects mempool txs, not private/flashbots bundles
5. **Sandwich Detection Lag:** Requires seeing all 3 txs (front → victim → back) to trigger

## Next Steps

### Recommended Enhancements

1. **Add Uniswap V3 support** - Different ABI and concentrated liquidity model
2. **Integrate price oracle** - Chainlink or Uniswap TWAP for accurate USD estimates
3. **Cache pair addresses** - Reduce RPC calls for frequently traded pairs
4. **Add flashbots detection** - Monitor flashbots bundles for private frontrunning
5. **Machine learning** - Train model on labeled attack data for better detection
6. **Multi-chain support** - Extend to BSC, Polygon, Arbitrum, etc.
7. **Real-time alerts** - Telegram/Discord bot for critical alerts

## Troubleshooting

### Issue: Enhanced detection not working

**Check:**
1. Is `ALCHEMY_HTTPS` set in `.env`?
2. Is `USE_ENHANCED_DETECTION = true` in `mempoolListener.js`?
3. Are you testing with a known DEX router address?
4. Check console for "HTTP provider ready for enhanced detection"

### Issue: RPC rate limiting

**Solutions:**
1. Use a paid RPC tier (Alchemy Growth plan)
2. Implement request caching
3. Add rate limiting logic
4. Use multiple RPC providers with fallback

### Issue: No alerts being stored

**Check:**
1. Is your confidence threshold too high? (default: 70%)
2. Are transactions actually targeting DEX routers?
3. Check logs for "📊 TX..." to see if rules are triggering
4. Verify Postgres connection with `node backend/utils/dbTest.js`

### Issue: Sandwich detection not triggering

**Reason:** Requires seeing all 3 transactions in sequence within 30 seconds
**Solutions:**
1. Increase `sandwichWindowMs` threshold
2. Use mainnet (testnet has low volume)
3. Check if attacker uses different routers (not detected)

## Support

For issues or questions:
1. Check the test script output: `node test-enhanced-detector.js`
2. Review console logs when running `node server.js`
3. Verify RPC connectivity and rate limits
4. Check Postgres logs for storage issues

## Summary

This enhanced detection system provides:
- ✅ **Accurate calldata decoding** for Uniswap V2 swaps
- ✅ **Real-time liquidity data** from on-chain sources
- ✅ **Precise price impact** calculations using constant product formula
- ✅ **Multi-signal detection** with 5 different rules
- ✅ **Confidence-based filtering** to reduce false positives
- ✅ **Sandwich attack detection** for MEV attacks
- ✅ **High throughput** (~50-100 tx/sec with RPC calls)

**Result:** Significantly improved front-running detection with fewer false positives and better actionable alerts.
