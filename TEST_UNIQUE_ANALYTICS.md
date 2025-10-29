# ⚡ Test Unique Analytics - Quick Guide

## 🎯 What to Test

Each alert should show **different, unique analytics** based on its transaction hash.

---

## 🚀 Quick Test (2 Minutes)

### Start Servers

```bash
# Terminal 1: Backend
cd C:\Users\yazhini\Protego\backend
npm start

# Terminal 2: Test alerts
cd backend
node test-real-time-alert.js
```

### Open Dashboard

```
http://localhost:3000/dashboard
```

---

## ✅ Verification Steps

### Step 1: Generate Alerts (30 seconds)
- Wait for **3 alerts** to appear
- Each has unique transaction hash

### Step 2: Click Alert 1 (30 seconds)
- Click first alert in Live Feed
- See analytics load in center column
- **Note the numbers:**
  - Risk distribution (Low/Med/High %)
  - Total Loss amount
  - Protection rate
- See **purple badge**: "Mock Data (Testing)"

### Step 3: Click Alert 2 (30 seconds)
- Click second alert
- Analytics refresh
- **Verify DIFFERENT from Alert 1:**
  - ✅ Different risk percentages
  - ✅ Different loss amounts
  - ✅ Different chart shapes
  - ✅ Different total stats

### Step 4: Click Alert 3 (30 seconds)
- Click third alert
- **Verify DIFFERENT from both previous:**
  - ✅ Unique risk distribution
  - ✅ Unique loss amounts
  - ✅ Unique trends

---

## 📊 Expected Results

### Alert Example A
```
Risk: High 60%, Medium 25%, Low 15%
Loss: $1,234.56
Protection: 65%
[🟣 Mock Data (Testing)]
```

### Alert Example B
```
Risk: High 5%, Medium 10%, Low 85%
Loss: $234.12
Protection: 88%
[🟣 Mock Data (Testing)]
```

### Alert Example C
```
Risk: High 20%, Medium 50%, Low 30%
Loss: $789.45
Protection: 74%
[🟣 Mock Data (Testing)]
```

---

## ✅ Success Criteria

- [ ] Each alert shows different analytics
- [ ] Charts change when switching alerts
- [ ] Purple "Mock Data" badge visible
- [ ] No errors in console
- [ ] Loading states work
- [ ] Back button returns to empty state

---

## 🎉 All Good?

If all checks pass, unique analytics are working!

**Full docs:** `UNIQUE_ANALYTICS_COMPLETE.md`
