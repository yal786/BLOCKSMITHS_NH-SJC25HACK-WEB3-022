# ⚡ Quick Reference - Protego Dashboard

## 🚀 Start Servers (2 Commands)

```bash
# Terminal 1: Backend
cd C:\Users\yazhini\Protego\backend
npm start

# Terminal 2: Test (Optional)
cd C:\Users\yazhini\Protego\backend
node test-real-time-alert.js
```

**Open:** http://localhost:3000/dashboard

---

## 🎯 How It Works

### 1️⃣ Dashboard Opens
- **Left:** Live Alerts Feed (🟢 LIVE indicator)
- **Center:** Empty state (shield icon)
- **Right:** Forensic Logs (search/filter)

### 2️⃣ Alert Arrives (Real-Time)
- Appears in Live Feed (left column)
- Browser notification pops up
- **Center stays empty**

### 3️⃣ Click Alert
- Alert highlights (cyan glow)
- **Center shows:**
  - Transaction details
  - Action buttons (Protect, Re-Simulate)
  - Analytics charts (filtered by this tx)

### 4️⃣ Click Back
- Returns to empty state
- Ready to select another alert

---

## ✅ Checklist

- [ ] Backend shows: `✅ Connected to Alchemy WSS`
- [ ] Dashboard shows: **🟢 LIVE** status
- [ ] Center column shows empty state initially
- [ ] Click alert → Analytics appear
- [ ] Click Back → Empty state returns
- [ ] Browser notifications work

---

## 🐛 Quick Fixes

### "OFFLINE" Status
```bash
cd backend
npm start
# Look for: "✅ Connected to Alchemy WSS"
```

### No Alerts
```bash
# Use test script:
cd backend
node test-real-time-alert.js
```

### Alchemy API Key Error
1. Get new key: https://dashboard.alchemy.com
2. Update `backend/.env`:
   ```
   ALCHEMY_WSS=wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
   ```
3. Restart: `npm start`

---

## 📚 Full Docs

- **ANALYTICS_ON_CLICK_COMPLETE.md** - Complete implementation guide
- **CHECK_REAL_TIME_SETUP.md** - Technical details
- **START_HERE.md** - Getting started guide

---

## 🎉 Features

✅ Real-time alerts from Alchemy (<200ms)  
✅ Analytics show ONLY on click  
✅ Empty state UX  
✅ Browser notifications  
✅ Live status indicator  
✅ No polling delays  
✅ No errors

**Enjoy!** 🚀🛡️✨
