# 🔍 How to Access Analytics Dashboard

## 📍 Where to Find Charts

### Step-by-Step Visual Guide

```
1. Start Backend Server
   ├─ Open Terminal/PowerShell
   ├─ cd C:\Users\yazhini\Protego\backend
   ├─ npm start
   └─ Wait for: "Server running on port 4000"

2. Start Frontend Server
   ├─ Open NEW Terminal
   ├─ cd C:\Users\yazhini\Protego\frontend
   ├─ npm run dev
   └─ Wait for: "Local: http://localhost:5173/"

3. Open Browser
   └─ Go to: http://localhost:5173/dashboard

4. You will see this page:
   ┌─────────────────────────────────────────┐
   │  Navbar                                 │
   ├─────────────────────────────────────────┤
   │  [📈 Show Analytics Dashboard] ← CLICK  │
   ├───────────────┬─────────────────────────┤
   │ Live Feed     │ Alert Details           │
   │               │                         │
   │ • Alert 1     │ Select an alert to see  │
   │ • Alert 2     │ details...              │
   │ • Alert 3     │                         │
   └───────────────┴─────────────────────────┘

5. After clicking the button, you'll see:
   ┌─────────────────────────────────────────┐
   │  [📊 Show Alerts Feed] ← Toggle back    │
   ├─────────────────────────────────────────┤
   │  📊 Analytics Dashboard                 │
   │  Auto-refresh every 30 seconds          │
   ├─────────────────────────────────────────┤
   │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
   │  │ Total   │ │ Total   │ │ Avg Gas │   │
   │  │ Events  │ │ Loss    │ │ Used    │   │
   │  └─────────┘ └─────────┘ └─────────┘   │
   ├─────────────────────────────────────────┤
   │  ┌───────────────┐ ┌─────────────────┐  │
   │  │📈 Simulation  │ │🎯 Risk          │  │
   │  │   Trend       │ │   Distribution  │  │
   │  │   (Line)      │ │   (Pie)         │  │
   │  └───────────────┘ └─────────────────┘  │
   │  ┌───────────────┐ ┌─────────────────┐  │
   │  │✅ Execution   │ │🛡️ Protection    │  │
   │  │   Status      │ │   Success       │  │
   │  │   (Bar)       │ │   (Donut)       │  │
   │  └───────────────┘ └─────────────────┘  │
   │  ┌─────────────────────────────────────┐│
   │  │💰 Loss vs Profit Trend              ││
   │  │   (Dual Line Chart)                 ││
   │  └─────────────────────────────────────┘│
   └─────────────────────────────────────────┘
```

---

## 🎯 The Button Location

The toggle button is at the **TOP of the dashboard page**, right below the Navbar.

It looks like this:

**When viewing Alerts:**
```
┌─────────────────────────────────────┐
│ [📈 Show Analytics Dashboard]      │ ← Pink/Red gradient button
└─────────────────────────────────────┘
```

**When viewing Analytics:**
```
┌─────────────────────────────────────┐
│ [📊 Show Alerts Feed]              │ ← Purple gradient button
└─────────────────────────────────────┘
```

---

## 🚀 Quick Access URL

Direct URL to Dashboard:
```
http://localhost:5173/dashboard
```

**Note:** The button will only appear when you're on the `/dashboard` route!

---

## 🔍 Troubleshooting: "I don't see the button!"

### Check 1: Are you on the right page?

Make sure URL is:
```
http://localhost:5173/dashboard
```

NOT:
- http://localhost:5173/ (Landing page)
- http://localhost:5173/builder (Transaction builder)
- http://localhost:5173/resimulate (Re-simulate page)

### Check 2: Is frontend running?

Open terminal and check:
```bash
cd frontend
npm run dev
```

### Check 3: Browser console errors?

1. Press F12 to open DevTools
2. Click "Console" tab
3. Look for any red errors
4. Share the errors if you see any

### Check 4: Check if file was saved

```bash
cd C:\Users\yazhini\Protego\frontend\src\pages
Get-Content Dashboard.jsx | Select-String "Show Analytics Dashboard"
```

Should show:
```
{showAnalytics ? '📊 Show Alerts Feed' : '📈 Show Analytics Dashboard'}
```

---

## 📸 What You Should See (Screenshots Description)

### Before Clicking Button:
- Left sidebar: List of alerts
- Right panel: Alert details or empty state
- Top: Pink/red gradient button "📈 Show Analytics Dashboard"

### After Clicking Button:
- Top: Purple gradient button "📊 Show Alerts Feed"
- Page title: "📊 Analytics Dashboard"
- 3 stat cards showing numbers
- 4 charts in 2x2 grid
- 1 wide chart at bottom

---

## 🧪 Quick Test

### Test if Analytics is Working:

1. Open browser console (F12)
2. Go to Network tab
3. Click "📈 Show Analytics Dashboard"
4. You should see a request to: `/api/dashboard-metrics`
5. Response should have `ok: true` and data

If you see this, analytics is working! ✅

---

## 📝 File Locations

If you want to edit:

**Toggle Button:**
```
frontend/src/pages/Dashboard.jsx
Line ~130-141
```

**Charts:**
```
frontend/src/components/charts/
├── SimulationTrendChart.jsx
├── RiskPieChart.jsx
├── ExecutionBarChart.jsx
├── LossProfitChart.jsx
├── ProtectionDonutChart.jsx
└── StatsCards.jsx
```

**Backend API:**
```
backend/routes/dashboardMetrics.js
```

---

## ✅ Verification Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 5173
- [ ] Opened http://localhost:5173/dashboard
- [ ] See the toggle button at top
- [ ] Clicked "Show Analytics Dashboard"
- [ ] See 3 stat cards
- [ ] See 5 charts
- [ ] Charts show data (not "No data available")

If all checked, you're good! ✅

---

## 🆘 Still Can't Find It?

Run this test command:

```bash
cd C:\Users\yazhini\Protego\frontend\src\pages
findstr /C:"Show Analytics" Dashboard.jsx
```

If it returns nothing, the file wasn't saved correctly.

If it shows the line, but you don't see the button, restart the frontend:
```bash
# Close frontend (Ctrl+C)
cd frontend
npm run dev
```

Then refresh browser (Ctrl+F5).

---

**Need more help?** Check if there are any console errors in browser (F12 → Console tab)
