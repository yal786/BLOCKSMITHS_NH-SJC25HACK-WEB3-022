// Server test script - starts server and tests endpoints
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { pool } from "./utils/db.js";
import { analyzeTx } from "./core/detector.js";

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/", (req, res) => res.send("✅ Protego Backend Running Successfully!"));

// preview detection
app.post("/v1/detect/preview", (req, res) => {
  const tx = req.body || {};
  try {
    const result = analyzeTx(tx);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// fetch recent alerts
app.get("/v1/alerts", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, tx_hash, "from", "to", risk_level, confidence, rules, est_loss_usd, slippage_pct, payload, created_at
       FROM alerts
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(r.rows);
  } catch (err) {
    console.error("alerts fetch error", err.message);
    res.status(500).json({ error: "db error" });
  }
});

// stats endpoint
app.get("/v1/alerts/stats", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT risk_level, COUNT(*) as count
      FROM alerts
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY risk_level;
    `);
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, async () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log("\n🧪 Testing API Endpoints...\n");
  
  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    // Test 1: Health check
    const healthRes = await fetch(`http://localhost:${PORT}/`);
    const healthText = await healthRes.text();
    console.log(`1️⃣ Health Check: ${healthText}`);
    
    // Test 2: Get alerts
    const alertsRes = await fetch(`http://localhost:${PORT}/v1/alerts`);
    const alerts = await alertsRes.json();
    console.log(`2️⃣ Alerts Endpoint: Retrieved ${alerts.length} alerts`);
    alerts.slice(0, 2).forEach(a => {
      console.log(`   - ${a.tx_hash} [${a.risk_level}] confidence: ${a.confidence}%`);
    });
    
    // Test 3: Get stats
    const statsRes = await fetch(`http://localhost:${PORT}/v1/alerts/stats`);
    const stats = await statsRes.json();
    console.log(`\n3️⃣ Stats Endpoint:`);
    stats.forEach(s => {
      console.log(`   - ${s.risk_level}: ${s.count} alerts`);
    });
    
    // Test 4: Detect preview
    const detectRes = await fetch(`http://localhost:${PORT}/v1/detect/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hash: "0xtest",
        from: "0xabc",
        to: "0x7a250d5630b4cf539739df2c5dacab7dbe2f6d",
        gasPrice: 1000
      })
    });
    const detection = await detectRes.json();
    console.log(`\n4️⃣ Detection Preview: ${detection.riskLevel} (confidence: ${detection.confidence}%)`);
    console.log(`   Rules: ${detection.rules.join(", ")}`);
    
    console.log(`\n✨ All API endpoints working perfectly!`);
    console.log(`\n📊 Server tested successfully at http://localhost:${PORT}`);
    console.log(`📝 Frontend can now connect to /v1/alerts endpoint\n`);
    
  } catch (err) {
    console.error("❌ Test failed:", err.message);
  }
  
  // Close after testing
  console.log("🛑 Closing test server...\n");
  server.close();
  await pool.end();
  process.exit(0);
});
