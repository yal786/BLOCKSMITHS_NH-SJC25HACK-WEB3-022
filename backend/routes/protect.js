// backend/routes/protect.js
// Flashbots Protect RPC endpoint for private transaction forwarding
import express from "express";
import axios from "axios";
import crypto from "crypto";
import { pool } from "../utils/db.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/**
 * POST /v1/protect
 * Forward a signed transaction to Flashbots Protect RPC
 * 
 * Body:
 * {
 *   "signedRawTx": "0xf86b...",
 *   "alertTxHash": "0x123..." // optional
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { signedRawTx, alertTxHash } = req.body;

    console.log("🛡️ [PROTECT] Received protection request");
    console.log("   Alert TX:", alertTxHash || "N/A");
    console.log("   Raw TX length:", signedRawTx?.length || 0);

    // Step 1: Validation
    if (!signedRawTx || typeof signedRawTx !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing signedRawTx field",
      });
    }

    if (!signedRawTx.startsWith("0x")) {
      return res.status(400).json({
        ok: false,
        error: "Invalid signedRawTx format (must start with 0x)",
      });
    }

    // Step 2: Check mode (demo or real)
    const mode = process.env.FLASHBOTS_MODE || "demo";
    const rpcUrl = process.env.FLASHBOTS_RPC || "https://rpc.flashbots.net";

    console.log(`   Mode: ${mode}`);

    let responseData = null;
    let txHash = null;
    let flashbotsResponse = null;

    if (mode === "demo") {
      // Step 3: Demo mode - generate fake tx hash
      console.log("   → Running in DEMO mode");
      txHash = "0x" + crypto.randomBytes(32).toString("hex");
      responseData = {
        ok: true,
        result: txHash,
        mode: "demo",
        message: "Transaction simulated (demo mode)",
      };
      flashbotsResponse = {
        jsonrpc: "2.0",
        id: 1,
        result: txHash,
      };
    } else {
      // Step 4: Real Flashbots RPC call
      console.log(`   → Calling Flashbots RPC: ${rpcUrl}`);

      try {
        const { data } = await axios.post(
          rpcUrl,
          {
            jsonrpc: "2.0",
            id: 1,
            method: "eth_sendRawTransaction",
            params: [signedRawTx],
          },
          {
            headers: { 
              "Content-Type": "application/json",
              "X-Flashbots-Signature": process.env.FLASHBOTS_SIGNATURE || "",
            },
            timeout: 15000,
          }
        );

        if (data.error) {
          console.error("   ❌ Flashbots RPC error:", data.error);
          return res.status(500).json({
            ok: false,
            error: data.error.message || "Flashbots RPC error",
            details: data.error,
          });
        }

        txHash = data.result;
        flashbotsResponse = data;
        responseData = {
          ok: true,
          result: txHash,
          mode: "real",
          message: "Transaction sent to Flashbots",
        };

        console.log("   ✅ Flashbots success:", txHash);
      } catch (rpcError) {
        console.error("   ❌ Flashbots network error:", rpcError.message);
        return res.status(500).json({
          ok: false,
          error: "Failed to connect to Flashbots RPC",
          details: rpcError.message,
        });
      }
    }

    // Step 5: Save to database (audit log)
    try {
      // Ensure table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS protects (
          id SERIAL PRIMARY KEY,
          alert_tx_hash TEXT,
          flashed_tx_hash TEXT,
          mode VARCHAR(20),
          response JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Insert record
      await pool.query(
        `INSERT INTO protects (alert_tx_hash, flashed_tx_hash, mode, response)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [alertTxHash || null, txHash, mode, JSON.stringify(flashbotsResponse)]
      );

      console.log("   📝 Logged to database");
    } catch (dbErr) {
      console.error("   ⚠️ DB log failed:", dbErr.message);
      // Continue anyway - don't fail the request
    }

    // Step 6: Create audit log entry
    try {
      await pool.query(
        `INSERT INTO audit_logs (event_type, related_tx_hash, meta, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          "protection_request",
          alertTxHash,
          JSON.stringify({
            protected_tx_hash: txHash,
            mode,
            timestamp: new Date().toISOString(),
          }),
        ]
      );
    } catch (auditErr) {
      console.error("   ⚠️ Audit log failed:", auditErr.message);
    }

    // Step 7: Return response
    console.log("   ✅ Protection complete");
    return res.json(responseData);

  } catch (err) {
    console.error("❌ [PROTECT] Error:", err.message);
    return res.status(500).json({
      ok: false,
      error: err.message || "Internal server error",
    });
  }
});

/**
 * GET /v1/protect/history
 * Get protection history
 */
router.get("/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await pool.query(
      `SELECT id, alert_tx_hash, flashed_tx_hash, mode, created_at
       FROM protects
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      ok: true,
      protects: result.rows,
    });
  } catch (err) {
    console.error("Error fetching protect history:", err.message);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

/**
 * GET /v1/protect/stats
 * Get protection statistics
 */
router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN mode = 'demo' THEN 1 END) as demo_count,
        COUNT(CASE WHEN mode = 'real' THEN 1 END) as real_count,
        MAX(created_at) as last_protection
      FROM protects
    `);

    res.json({
      ok: true,
      stats: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching protect stats:", err.message);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

export default router;
