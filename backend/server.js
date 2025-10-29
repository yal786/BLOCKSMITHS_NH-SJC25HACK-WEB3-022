// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { pool } from "./utils/db.js";
import { analyzeTx } from "./core/detector.js";
import { startMempoolListener } from "./core/mempoolListener.js";
import simulateRoute from "./src/api/simulateRoute.js";
import simulateRouter from "./routes/simulateRouter.js";
import protectRouter from "./routes/protect.js";
import dashboardMetricsRouter from "./routes/dashboardMetrics.js";
import mockDashboardMetricsRouter from "./routes/mockDashboardMetrics.js";
import reportsRouter from "./routes/reports.js";
import protyRouter from "./routes/proty.js";
import http from "http";
import { Server as IOServer } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/", (req, res) => res.send("✅ Protego Backend Running Successfully!"));

// preview detection: frontend posts unsigned tx JSON and gets analyzeTx result
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

// optionally expose aggregated stats endpoint (simple)
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

// optional demo protect endpoint
app.post("/v1/protect/send", (req, res) => {
  // demo-only: accept { signedRawTx } and return accepted_demo
  return res.json({ status: "accepted_demo", details: "This is a demo response. Implement Flashbots Protect in prod." });
});

// simulation endpoints (both old and new paths)
app.use("/api/simulate", simulateRoute);
app.use("/v1/simulate", simulateRouter); // Primary simulation route

// protect endpoint (Flashbots)
app.use("/v1/protect", protectRouter);

// dashboard analytics metrics
app.use("/api/dashboard-metrics", dashboardMetricsRouter);

// mock dashboard metrics (for testing with varied data per transaction)
app.use("/api/mock-dashboard-metrics", mockDashboardMetricsRouter);

// reports endpoints (JSON and PDF)
app.use("/v1/reports", reportsRouter);

// proty AI chatbot endpoint
app.use("/api/proty", protyRouter);

// HTTP + socket server so mempool can emit updates
const httpServer = http.createServer(app);
const io = new IOServer(httpServer, {
  cors: { origin: true }
});

// start mempool listener with io so it can emit 'new_alert'
startMempoolListener(io);

// start server
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
