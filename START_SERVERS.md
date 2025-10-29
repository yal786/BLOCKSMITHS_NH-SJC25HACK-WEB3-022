# 🚀 How to Start Protego Servers

## ✅ Ports Now Free!
Both ports 4000 and 3000 have been cleared and are ready for use.

---

## 🖥️ Start Backend Server

Open a **NEW** terminal window and run:

```powershell
cd C:\Users\yazhini\Protego\backend
npm start
```

**Expected Output:**
```
Server running on port 4000
✅ Connected to Alchemy WSS
Starting mempool listener...
```

**Keep this terminal running!**

---

## 🌐 Start Frontend Server

Open **ANOTHER NEW** terminal window and run:

```powershell
cd C:\Users\yazhini\Protego\frontend
npm run dev
```

**Expected Output:**
```
VITE v7.1.12  ready in XXX ms

➜  Local:   http://localhost:3000/
```

**Keep this terminal running too!**

---

## 🧪 Test the Re-simulate Transaction Flow

1. **Open browser**: http://localhost:3000

2. **Navigate to Dashboard** (or click Dashboard in navbar)

3. **Select any alert** from the live feed

4. **Click "🛡️ Protect Transaction"** button

5. **In the Protect Modal**:
   - Click "📝 Sign Demo TX" (auto-generates signed transaction)
   - Click "🚀 Send to Flashbots"
   - Wait for success message ✅

6. **After Success, you'll see**:
   ```
   ✅ Transaction Protected Successfully!
   Transaction Hash: 0xabc123...
   Mode: demo
   
   [🔁 Re-simulate This Transaction] ← Click this button
   ```

7. **You'll be redirected to Re-simulate page**:
   - ✨ **Auto-filled notification** will appear
   - Transaction hash is **already filled** in the input
   - Click "🚀 Fetch & Re-Simulate Transaction"

8. **View Results**:
   - ✅ Execution Status
   - ⚙️ Gas Used
   - 💰 Estimated Loss (USD)
   - 🎯 Attacker Profit (USD)
   - 📉 Slippage %
   - 🔗 View Full Simulation on Tenderly

---

## 🔧 Alternative: Test with Manual Hash Entry

You can also go directly to: http://localhost:3000/re-simulate

And paste any recent Ethereum mainnet transaction hash, for example:
- Find a recent transaction on https://etherscan.io
- Copy the transaction hash
- Paste in the input field
- Click "Fetch & Re-Simulate"

---

## 🛑 How to Stop Servers

**In each terminal window**, press:
```
Ctrl + C
```

---

## 🔍 Troubleshooting

### Issue: "EADDRINUSE: address already in use"

**Solution:**
```powershell
# Find and kill process on port 4000 (backend)
netstat -ano | findstr :4000
taskkill /PID <PID_NUMBER> /F

# Find and kill process on port 3000 (frontend)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Issue: "Cannot connect to backend"

**Check:**
1. Backend server is running on port 4000
2. `.env` file exists in backend folder with correct DATABASE_URL and TENDERLY credentials
3. PostgreSQL database is running

### Issue: "Re-simulation failed: 404"

**Cause:** Transaction not found in Tenderly's database

**Solution:** Use the Protect→Re-simulate flow (uses demo transactions) or use a very recent mainnet transaction from Etherscan.

---

## ✅ Ready to Test!

Both servers are ready to start. Open two separate terminal windows and follow the instructions above!
