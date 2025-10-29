# 🚀 How to Run Unique Transactions Implementation

## ⚡ TLDR - Quick Start

The implementation is **already applied**! Just verify and start using:

```bash
# Option 1: Double-click this file
VERIFY_UNIQUE.bat

# Option 2: Start backend normally
cd backend
npm start

# Option 3: Use your existing batch files
start-backend.bat
```

---

## 📋 Step-by-Step Guide

### Step 1: Verify Implementation (Optional but Recommended)

**Option A: Using Batch File**
```bash
# Just double-click:
VERIFY_UNIQUE.bat
```

**Option B: Manual Command**
```bash
cd backend
node test-unique-transactions.js
```

**Expected Output:**
```
🎉 ALL TESTS PASSED! Unique transactions implementation is working correctly!
```

---

### Step 2: Start Your Backend

The unique transaction logic is now part of your code, so just start normally:

**Option A: Using Your Existing Batch File**
```bash
# Double-click:
start-backend.bat
```

**Option B: Using New Batch File**
```bash
# Double-click:
RUN_UNIQUE_TRANSACTIONS.bat
```

**Option C: Manual Start**
```bash
cd backend
npm start
```

---

### Step 3: Start Your Frontend (In New Terminal)

```bash
# Double-click:
start-frontend.bat

# OR manually:
cd frontend
npm run dev
```

---

### Step 4: See It In Action

1. **Open Dashboard**: http://localhost:5173
2. **Watch Console Logs**: Look for these messages in backend terminal:
   ```
   📊 Logged event: simulation - success (risk: HIGH)
   📊 Duplicate event skipped: 0xabc123 - simulation
   ```
3. **Check Analytics**: Dashboard shows accurate unique counts

---

## 🔍 How to Verify It's Working

### Method 1: Watch Backend Logs
When the backend runs, you'll see:
- ✅ `Logged event: simulation - success` (first occurrence)
- ⚠️ `Duplicate event skipped: 0xabc123 - simulation` (duplicates)

### Method 2: Check Database Directly
```bash
cd backend
node -e "import { pool } from './utils/db.js'; const r = await pool.query('SELECT COUNT(*) as total, COUNT(DISTINCT tx_hash) as unique FROM alerts'); console.log('Alerts - Total:', r.rows[0].total, 'Unique:', r.rows[0].unique); process.exit(0);"
```

Should show: **Total equals Unique** (no duplicates)

### Method 3: Test with Real Transaction
Try simulating the same transaction twice through your UI - it will only log once!

---

## 🧪 Testing Commands

### Quick Test
```bash
cd backend
node test-unique-transactions.js
```

### Check Current Stats
```bash
cd backend
node -e "
import { pool } from './utils/db.js';
const alerts = await pool.query('SELECT COUNT(*) as count FROM alerts');
const events = await pool.query('SELECT COUNT(*) as count FROM events_log');
console.log('📊 Database Stats:');
console.log('   Alerts:', alerts.rows[0].count);
console.log('   Events:', events.rows[0].count);
process.exit(0);
"
```

### Check for Duplicates (Should Return Empty)
```bash
cd backend
node -e "
import { pool } from './utils/db.js';
const dupes = await pool.query('SELECT tx_hash, COUNT(*) as count FROM alerts GROUP BY tx_hash HAVING COUNT(*) > 1');
if (dupes.rows.length === 0) {
  console.log('✅ No duplicates found!');
} else {
  console.log('⚠️ Duplicates found:', dupes.rows);
}
process.exit(0);
"
```

---

## 🔄 If You Need to Re-Apply Migration

**Only if something went wrong:**

```bash
cd backend
node scripts/run-unique-constraints.js
```

This will:
- Remove any duplicate entries
- Add unique constraints (if not already present)
- Verify everything is correct

---

## 🎯 What Happens Now

### When Backend Starts:
✅ All database insert operations automatically use unique constraints
✅ Duplicate transactions are silently skipped
✅ Your existing code works exactly the same

### When You Simulate Transactions:
✅ First time: Logged to database
✅ Second time: Skipped with log message "Duplicate event skipped"
✅ Analytics: Shows accurate unique counts

### In Real-Time Monitoring:
✅ Mempool listener detects transactions
✅ Each transaction stored only once
✅ Dashboard shows real unique transaction counts

---

## 🛠️ Troubleshooting

### Issue: "constraint already exists" error
**Solution:** That's fine! It means migration already ran. Just start the server.

### Issue: Still seeing duplicates
**Solution:** Re-run migration:
```bash
cd backend
node scripts/run-unique-constraints.js
```

### Issue: Frontend not showing data
**Solution:** 
1. Make sure both backend and frontend are running
2. Check http://localhost:4000/api/dashboard-metrics
3. Clear browser cache

---

## 📊 Expected Behavior

### Console Output Example:
```
[dotenv] injecting env from .env
Server running on port 4000
✅ Connected to Alchemy WSS
📊 TX 0xabc123... - Risk: HIGH, Confidence: 85, Rules: sandwich, frontrun
🚨 HIGH-CONFIDENCE ALERT SAVED - TX: 0xabc123..., Risk: HIGH, Confidence: 85%
📊 Logged event: simulation - success (risk: HIGH)

... (same transaction detected again)
📊 Duplicate event skipped: 0xabc123... - simulation
```

### Database Stats:
```
📊 Database Stats:
   Alerts: 19,406 (all unique)
   Events: 19 (all unique by tx_hash + event_type)
```

---

## ✅ Quick Checklist

- [ ] Migration ran successfully ✅ (Already done!)
- [ ] Tests pass ✅ (Already verified!)
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] Console shows "Duplicate event skipped" for repeat transactions
- [ ] Dashboard shows accurate analytics

---

## 🎉 You're Ready!

Just start your servers normally:
1. `start-backend.bat` (or `RUN_UNIQUE_TRANSACTIONS.bat`)
2. `start-frontend.bat`
3. Visit http://localhost:5173

**The unique transaction handling is now automatic!**
