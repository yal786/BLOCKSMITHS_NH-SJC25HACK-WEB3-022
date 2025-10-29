# 🧪 Test Re-simulate Feature Now!

## ✅ What Was Fixed

1. ✅ **Frontend Validation** - Checks that `to` and `data` start with `0x`
2. ✅ **Backend Validation** - Clear error messages for missing fields
3. ✅ **Data Formatting** - Value is properly converted to hex
4. ✅ **Response Format** - Matches specification with `execution_status`, `gas_used`, etc.
5. ✅ **UI Display** - Shows execution status, gas used, and all metrics

---

## 🚀 Start Testing (3 Steps)

### Step 1: Restart Backend

**Stop the current backend (Ctrl+C)** then:

```bash
cd C:\Users\yazhini\Protego\backend
node server.js
```

Expected: `Server running on port 4000`

### Step 2: Verify Frontend API URL

Edit `frontend/src/services/api.js`:

```javascript
export const api = axios.create({
  baseURL: "http://localhost:4000",  // Changed from 8080
  timeout: 30000,
});
```

### Step 3: Start/Restart Frontend

```bash
cd C:\Users\yazhini\Protego\frontend
npm run dev
```

---

## 🧪 Test Case: ERC-20 Transfer

Use the exact data from your screenshot:

### Input Values:

| Field | Value |
|-------|-------|
| **From** | `0x370f63792806dbfb0f6bbbe093745535649f8c62` |
| **To** | `0x514910771af9ca656af840dff83e8264ecf986ca` |
| **Value** | `0` (will be converted to `0x0`) |
| **Gas Limit** | `38400` |
| **Max Fee Per Gas** | `58000000000` |
| **Chain ID** | `1` |
| **Data** | `0xa9059cbb0000000000000000000000006c9ab24e02970c7c41e0eddfd7f5d8e5b9b5f20c000000000000000000000000000000000000000000000000000000000000000a` |

### Steps:

1. Open: **http://localhost:5173/dashboard**
2. Click any alert
3. Click **"🔬 Re-simulate"** (yellow button)
4. Fields should be pre-filled from alert data
5. Or paste the values above
6. Click **"Run Simulation"**

### Expected Result:

You should see:

```
✅ Simulation Successful

Execution Status: Success

⚙️ Gas Used: 38,400

💰 Estimated Loss: $0.XX
🎯 Attacker Profit: $0.XX
📉 Slippage: 0.XX%

🔗 View Full Simulation on Tenderly →
```

---

## 🔍 What Each Field Does

### From Address
The sender of the transaction (your wallet address)

### To Address  
The contract being called (e.g., ERC-20 token contract, DEX router)

### Value
Amount of ETH being sent (in wei). Use `0` for token transfers, or actual amount for ETH swaps.

### Gas Limit
Maximum gas allowed for the transaction. Common values:
- Simple transfer: `21000`
- Token transfer: `38400` - `65000`
- DEX swap: `150000` - `300000`

### Max Fee Per Gas
Gas price in wei (not gwei!). Example:
- 30 gwei = `30000000000` wei
- 50 gwei = `50000000000` wei
- 58 gwei = `58000000000` wei

### Chain ID
- Ethereum Mainnet: `1`
- Goerli Testnet: `5`
- Sepolia: `11155111`

### Data
The encoded function call. Examples:
- ERC-20 `transfer()`: Starts with `0xa9059cbb`
- Uniswap `swapExactTokensForTokens()`: Starts with `0x38ed1739`
- Empty for simple ETH transfer: `0x`

---

## ✅ Expected Responses

### Success Case:

```json
{
  "ok": true,
  "simulation": {
    "execution_status": "success",
    "gas_used": 38400,
    "estimated_loss_usd": 0.15,
    "attacker_profit_usd": 0.06,
    "slippage_percent": 0.001,
    "tenderly_url": "https://dashboard.tenderly.co/..."
  }
}
```

**UI Shows:**
- ✅ Green success banner
- Gas used in large text
- All metrics displayed
- Tenderly link active

### Reverted Case:

```json
{
  "ok": true,
  "simulation": {
    "execution_status": "reverted",
    "revert_reason": "Insufficient balance",
    "gas_used": 21000,
    ...
  }
}
```

**UI Shows:**
- ❌ Red reverted banner
- Revert reason displayed
- Metrics still shown

### Error Case (Missing Field):

```json
{
  "ok": false,
  "error": "Missing required fields: data is required"
}
```

**UI Shows:**
- Red error message at bottom
- No results displayed

---

## 🐛 Common Issues & Fixes

### Issue: "Invalid To address: must start with 0x"

**Cause:** Address doesn't start with `0x`
**Fix:** Add `0x` prefix to address

### Issue: "Invalid data format: must start with 0x"

**Cause:** Data field doesn't start with `0x`
**Fix:** Add `0x` prefix to data

### Issue: "Missing required fields"

**Cause:** Field is empty or not sent properly
**Fix:** Fill in all required fields (from, to, data)

### Issue: Backend returns 500 error

**Cause:** Tenderly API issue or network problem
**Fix:** Check backend logs. System will use fallback values automatically.

---

## 📊 Database Check

After a successful simulation:

```bash
docker exec -i protego-db psql -U admin -d protego -c "SELECT id, alert_tx_hash, execution_status, gas_used, estimated_loss_usd, created_at FROM simulations ORDER BY created_at DESC LIMIT 1;"
```

Should show your simulation record.

---

## 🎯 Success Indicators

You'll know it's working when:

✅ Modal opens without errors
✅ All fields are editable
✅ Click "Run Simulation" → Shows "⏳ Running Simulation..."
✅ After 5-10 seconds → Results appear
✅ Execution status shows (Success or Reverted)
✅ Gas used is displayed
✅ Metrics show real values (not N/A)
✅ Tenderly link is clickable
✅ Database has new record

---

## 🔥 Quick Validation

**Test 1: Valid Transaction**
- Use the ERC-20 transfer data above
- Should return **success**

**Test 2: Missing Data**
- Clear the Data field
- Should show error: **"Invalid data format: must start with 0x"**

**Test 3: Invalid Address**
- Change To address to `abc123`
- Should show error: **"Invalid To address: must start with 0x"**

---

## 📞 Need Help?

Check these in order:

1. **Backend logs** - See what's happening on server
2. **Browser console (F12)** - Check for frontend errors
3. **Network tab** - See the actual API request/response
4. **Database** - Verify simulation was saved

---

## 🎉 You're Ready!

The fix is deployed. Just restart your backend and test with the ERC-20 transfer transaction above!

**Expected Result:** ✅ Simulation Successful with all metrics displayed!
