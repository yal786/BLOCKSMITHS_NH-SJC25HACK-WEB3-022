// backend/routes/simulateRouter.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { pool, logEvent } from "../utils/db.js";

dotenv.config();
const router = express.Router();

const {
  TENDERLY_ACCESS_KEY,
  TENDERLY_ACCOUNT,
  TENDERLY_PROJECT,
  ALCHEMY_HTTPS,
} = process.env;

// Initialize Ethereum provider for fetching transactions
const provider = ALCHEMY_HTTPS ? new ethers.JsonRpcProvider(ALCHEMY_HTTPS) : null;

// Helper: normalize values
const normalizeValue = (v) => {
  if (!v) return "0x0";
  if (typeof v === "string" && v.startsWith("0x")) return v;
  return `0x${BigInt(v).toString(16)}`;
};

// POST /v1/simulate
// Supports two modes:
// 1. Hash-based: { txHash: "0x..." } - Fetches TX from Tenderly
// 2. Manual: { tx: {...}, alertTxHash: "..." } - Direct simulation
router.post("/", async (req, res) => {
  try {
    const { tx, alertTxHash, txHash } = req.body;
    
    // MODE 1: Hash-based re-simulation
    if (txHash) {
      console.log("🔍 Hash-based re-simulation requested:", txHash);
      
      if (!TENDERLY_ACCESS_KEY || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT) {
        return res.status(500).json({ 
          ok: false, 
          error: "Tenderly not configured in .env"
        });
      }
      
      try {
        // Step 1: Fetch transaction from blockchain via Ethereum RPC
        console.log("📡 Fetching transaction from blockchain...");
        
        if (!provider) {
          throw new Error("Ethereum provider not configured (missing ALCHEMY_HTTPS)");
        }
        
        const txData = await provider.getTransaction(txHash);
        
        if (!txData) {
          throw new Error("Transaction not found on blockchain");
        }
        
        console.log("✅ Transaction fetched from blockchain");
        
        // Convert ethers.js transaction format to our format
        const transaction = {
          from: txData.from,
          to: txData.to,
          value: txData.value.toString(),
          gas: Number(txData.gasLimit),
          gas_price: txData.gasPrice ? txData.gasPrice.toString() : (txData.maxFeePerGas ? txData.maxFeePerGas.toString() : "0"),
          input: txData.data,
          hash: txData.hash,
          block_number: txData.blockNumber,
          network_id: txData.chainId.toString(),
          status: "0x1" // Assume success for mined transactions
        };
        
        // Step 2: Use fetched data to run a NEW simulation
        console.log("🔬 Running re-simulation with fetched transaction data...");
        
        const simPayload = {
          network_id: transaction.network_id?.toString() || "1",
          from: transaction.from,
          to: transaction.to,
          input: transaction.input || "0x",
          value: normalizeValue(transaction.value),
          gas: parseInt(transaction.gas || 8000000),
          gas_price: transaction.gas_price?.toString() || "0",
          save: true,
          save_if_fails: true,
        };

        const simUrl = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/simulate`;
        const { data: simData } = await axios.post(simUrl, simPayload, {
          headers: {
            "X-Access-Key": TENDERLY_ACCESS_KEY,
            "Content-Type": "application/json",
          },
          timeout: 40000,
        });

        console.log("✅ Re-simulation completed successfully");

        const simulation = simData?.simulation || simData;
        const tenderlyUrl = `https://dashboard.tenderly.co/${TENDERLY_ACCOUNT}/${TENDERLY_PROJECT}/simulator/${simulation?.id}`;
        
        // Get execution status
        const execution_status = simulation?.status === true || simulation?.transaction?.status === "0x1" ? "success" : "reverted";
        const revert_reason = simulation?.transaction?.error_message || null;

        // Calculate metrics from Tenderly response
        const gas_used = simulation?.gas_used || simulation?.transaction?.gas_used || 0;
        const gasPrice = parseInt(transaction.gas_price || "30000000000"); // 30 gwei default
        const ethPrice = 3000; // Simplified - would fetch real price in production
        
        const gasCostUsd = (gas_used * gasPrice / 1e18) * ethPrice;
        
        // Heuristic calculations
        const estimated_loss_usd = gasCostUsd > 0 ? gasCostUsd * 1.5 : 0;
        const attacker_profit_usd = estimated_loss_usd * 0.4;
        const slippage_percent = (estimated_loss_usd / 100) * 0.5;

        // Save to DB
        try {
          const insertQuery = `
            INSERT INTO simulations (alert_tx_hash, simulation_id, estimated_loss_usd,
              attacker_profit_usd, slippage_percent, scenario_trace, sim_url, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
          `;
          const values = [
            txHash,
            simulation?.id || null,
            estimated_loss_usd,
            attacker_profit_usd,
            slippage_percent,
            JSON.stringify(simulation),
            tenderlyUrl,
          ];

          const result = await pool.query(insertQuery, values);
          const simId = result.rows[0].id;

          await pool.query(
            `INSERT INTO audit_logs (event_type, related_tx_hash, meta, created_at)
             VALUES ($1, $2, $3, NOW())`,
            ["resimulation_done", txHash, JSON.stringify({ simId, tenderlyUrl, provider: "tenderly" })]
          );

          console.log(`✅ Re-simulation saved to DB: ID ${simId}`);

          // Log event for dashboard analytics
          await logEvent({
            txHash,
            eventType: 'simulation',
            status: execution_status,
            riskLevel: 'medium', // Can be determined from transaction analysis
            gasUsed: gas_used,
            lossUsd: estimated_loss_usd,
            profitUsd: attacker_profit_usd,
            slippage: slippage_percent
          });

        } catch (dbErr) {
          console.error("⚠️ Database save failed:", dbErr.message);
        }

        return res.json({
          ok: true,
          mode: "hash",
          transaction: {
            from: transaction.from,
            to: transaction.to,
            value: transaction.value,
            gas: transaction.gas,
            gasPrice: transaction.gas_price,
            input: transaction.input,
            hash: transaction.hash,
            blockNumber: transaction.block_number,
            status: transaction.status,
          },
          simulation: {
            execution_status,
            revert_reason,
            gas_used,
            estimated_loss_usd: parseFloat(estimated_loss_usd.toFixed(2)),
            attacker_profit_usd: parseFloat(attacker_profit_usd.toFixed(2)),
            slippage_percent: parseFloat(slippage_percent.toFixed(2)),
            tenderly_url: tenderlyUrl,
          },
        });
      } catch (err) {
        console.error("❌ Re-simulation failed:", err.message);
        console.error("Error details:", err.response?.data || err);
        return res.status(500).json({
          ok: false,
          error: "Re-simulation failed: " + (err.response?.data?.error?.message || err.message),
        });
      }
    }
    
    // MODE 2: Manual simulation (existing logic)
    console.log("📊 Manual simulation request received:", { alertTxHash, hasFrom: !!tx?.from, hasTo: !!tx?.to, hasData: !!tx?.data });
    console.log("📊 Transaction details:", JSON.stringify(tx, null, 2));
    
    // Validate required fields: to and data
    if (!tx?.to) {
      return res.status(400).json({ ok: false, error: "Missing required fields: to is required" });
    }
    
    if (!tx?.data) {
      return res.status(400).json({ ok: false, error: "Missing required fields: data is required" });
    }
    
    if (!tx?.from) {
      return res.status(400).json({ ok: false, error: "Missing required fields: from is required" });
    }

    if (!TENDERLY_ACCESS_KEY || !TENDERLY_ACCOUNT || !TENDERLY_PROJECT) {
      console.error("❌ Tenderly not configured in .env");
      return res.status(500).json({ 
        ok: false, 
        error: "Tenderly not configured in .env",
        fallback: true,
        simulation: {
          estimated_loss_usd: 12.3,
          attacker_profit_usd: 4.1,
          slippage_percent: 1.8,
          sim_url: null,
        }
      });
    }

    const payload = {
      network_id: tx.chainId?.toString() || "1",
      from: tx.from,
      to: tx.to,
      input: tx.data || tx.input || "0x",
      value: normalizeValue(tx.value),
      gas: parseInt(tx.gasLimit || tx.gas || 8000000),
      gas_price: tx.maxFeePerGas?.toString() || tx.gasPrice?.toString(),
      save: true,
      save_if_fails: true,
    };

    const url = `https://api.tenderly.co/api/v1/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/simulate`;
    const headers = {
      "X-Access-Key": TENDERLY_ACCESS_KEY,
      "Content-Type": "application/json",
    };

    console.log("🔬 Calling Tenderly API...");
    
    let tenderlyRes;
    let usedFallback = false;
    
    try {
      tenderlyRes = await axios.post(url, payload, {
        headers,
        timeout: 40000,
      });
      console.log("✅ Tenderly API success");
    } catch (err) {
      console.error("⚠️ Tenderly simulation failed:", err.message);
      
      // Use fallback
      usedFallback = true;
      const fallbackData = {
        estimated_loss_usd: 12.3,
        attacker_profit_usd: 4.1,
        slippage_percent: 1.8,
        sim_url: null,
      };

      // Still try to save to DB with fallback data
      try {
        const insertQuery = `
          INSERT INTO simulations (alert_tx_hash, simulation_id, estimated_loss_usd,
            attacker_profit_usd, slippage_percent, scenario_trace, sim_url, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id
        `;
        const values = [
          alertTxHash || null,
          null,
          fallbackData.estimated_loss_usd,
          fallbackData.attacker_profit_usd,
          fallbackData.slippage_percent,
          JSON.stringify({ fallback: true, error: err.message }),
          null,
        ];

        const result = await pool.query(insertQuery, values);
        const simId = result.rows[0].id;

        await pool.query(
          `INSERT INTO audit_logs (event_type, related_tx_hash, meta, created_at)
           VALUES ($1, $2, $3, NOW())`,
          ["simulation_fallback", alertTxHash, JSON.stringify({ simId, error: err.message })]
        );

        return res.status(200).json({
          ok: true,
          fallback: true,
          simulation: {
            id: simId,
            ...fallbackData,
          },
        });
      } catch (dbErr) {
        console.error("❌ Database error:", dbErr.message);
        return res.status(500).json({
          ok: false,
          error: "Simulation and database failed",
          fallback: true,
          simulation: fallbackData,
        });
      }
    }

    const data = tenderlyRes.data;
    const simulation = data?.simulation || data;
    const simUrl = `https://dashboard.tenderly.co/${TENDERLY_ACCOUNT}/${TENDERLY_PROJECT}/simulator/${simulation?.id}`;
    const trace = simulation || {};

    // Get execution status
    const execution_status = simulation?.status === true || simulation?.transaction?.status === "0x1" ? "success" : "reverted";
    const revert_reason = simulation?.transaction?.error_message || null;

    // Calculate metrics from Tenderly response
    const gas_used = simulation?.gas_used || simulation?.transaction?.gas_used || 0;
    const gasPrice = parseInt(tx.gasPrice || tx.maxFeePerGas || "30000000000"); // 30 gwei default
    const ethPrice = 3000; // Simplified - would fetch real price in production
    
    const gasCostUsd = (gas_used * gasPrice / 1e18) * ethPrice;
    
    // Heuristic calculations
    const estimated_loss_usd = gasCostUsd > 0 ? gasCostUsd * 1.5 : 0;
    const attacker_profit_usd = estimated_loss_usd * 0.4;
    const slippage_percent = (estimated_loss_usd / 100) * 0.5;

    // Save to DB
    try {
      const insertQuery = `
        INSERT INTO simulations (alert_tx_hash, simulation_id, estimated_loss_usd,
          attacker_profit_usd, slippage_percent, scenario_trace, sim_url, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id
      `;
      const values = [
        alertTxHash || null,
        simulation?.id || null,
        estimated_loss_usd,
        attacker_profit_usd,
        slippage_percent,
        JSON.stringify(trace),
        simUrl,
      ];

      const result = await pool.query(insertQuery, values);
      const simId = result.rows[0].id;

      // Insert audit log
      await pool.query(
        `INSERT INTO audit_logs (event_type, related_tx_hash, meta, created_at)
         VALUES ($1, $2, $3, NOW())`,
        ["simulation_done", alertTxHash, JSON.stringify({ simId, simUrl, provider: "tenderly" })]
      );

      console.log(`✅ Simulation saved to DB: ID ${simId}`);

      res.status(200).json({
        ok: true,
        fallback: usedFallback,
        simulation: {
          id: simId,
          simulation_id: simulation?.id || null,
          execution_status,
          revert_reason,
          gas_used,
          estimated_loss_usd: parseFloat(estimated_loss_usd.toFixed(2)),
          attacker_profit_usd: parseFloat(attacker_profit_usd.toFixed(2)),
          slippage_percent: parseFloat(slippage_percent.toFixed(2)),
          tenderly_url: simUrl,
          sim_url: simUrl, // Keep for compatibility
        },
        raw: data,
      });
    } catch (dbErr) {
      console.error("❌ Database save failed:", dbErr.message);
      
      // Return simulation results even if DB save fails
      return res.status(200).json({
        ok: true,
        dbSaveFailed: true,
        simulation: {
          simulation_id: simulation?.id || null,
          estimated_loss_usd: parseFloat(estimated_loss_usd.toFixed(2)),
          attacker_profit_usd: parseFloat(attacker_profit_usd.toFixed(2)),
          slippage_percent: parseFloat(slippage_percent.toFixed(2)),
          sim_url: simUrl,
          gas_used: gasUsed,
        },
        raw: data,
      });
    }
  } catch (error) {
    console.error("❌ Simulation error:", error.message);
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      fallback: true,
      simulation: {
        estimated_loss_usd: 12.3,
        attacker_profit_usd: 4.1,
        slippage_percent: 1.8,
        sim_url: null,
      }
    });
  }
});

// GET /v1/simulate/history/:txHash - Get simulation history for a transaction
router.get("/history/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM simulations WHERE alert_tx_hash = $1 ORDER BY created_at DESC`,
      [txHash]
    );

    res.json({
      ok: true,
      simulations: result.rows,
    });
  } catch (error) {
    console.error("Error fetching simulation history:", error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;
