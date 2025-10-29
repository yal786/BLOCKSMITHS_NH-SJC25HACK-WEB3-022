// backend/core/mempoolListener.js
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

import { analyzeTx } from "./detector.js";
import { insertAlert } from "../utils/db.js";
import { KNOWN_FACTORIES } from "./detectorHelpers.js";

const ALCHEMY_WSS = process.env.ALCHEMY_WSS;
const ALCHEMY_HTTP = process.env.ALCHEMY_HTTP || process.env.ALCHEMY_HTTPS;

if (!ALCHEMY_WSS) {
  console.error("ALCHEMY_WSS not set in .env");
  process.exit(1);
}

// Configuration
const CONFIDENCE_THRESHOLD = 70; // Only store alerts with confidence >= 70
const USE_ENHANCED_DETECTION = true; // Toggle enhanced detection (set false for basic mode)

let wsProvider; // WebSocket provider for listening to mempool
let httpProvider; // HTTP provider for on-chain calls (reserves, etc)
let isConnecting = false;

export async function startMempoolListener(io) {
  if (isConnecting) return;
  isConnecting = true;

  console.log("Starting mempool listener (Alchemy WSS)...");
  
  try {
    // WebSocket provider for pending tx listening
    wsProvider = new ethers.WebSocketProvider(ALCHEMY_WSS);
    
    // Add error handler BEFORE connecting
    wsProvider.on("error", (error) => {
      console.error("⚠️ WebSocket error:", error.message);
      if (error.message.includes("401")) {
        console.error("❌ Alchemy API key is invalid or expired");
        console.error("   Update ALCHEMY_WSS in .env file");
      }
      // Don't crash, just log the error
    });

    await wsProvider.getNetwork();
    console.log("✅ Connected to Alchemy WSS");

    // HTTP provider for on-chain calls (if enhanced detection enabled)
    if (USE_ENHANCED_DETECTION && ALCHEMY_HTTP) {
      httpProvider = new ethers.JsonRpcProvider(ALCHEMY_HTTP);
      console.log("✅ HTTP provider ready for enhanced detection");
    } else if (USE_ENHANCED_DETECTION && !ALCHEMY_HTTP) {
      console.warn("⚠️ ALCHEMY_HTTP not set - using basic detection only");
    }

    isConnecting = false;
    
    // Set up pending transaction listener
    wsProvider.on("pending", async (txHash) => {
      try {
        const tx = await wsProvider.getTransaction(txHash);
        if (!tx || !tx.to) return;

        // Use enhanced detection if enabled and HTTP provider available
        const result = USE_ENHANCED_DETECTION && httpProvider
          ? await analyzeTx(tx, httpProvider, KNOWN_FACTORIES.uniswapV2)
          : await analyzeTx(tx); // Falls back to basic detection

        // Debug logging for all transactions (optional - comment out for production)
        if (result.riskLevel === "LOW") {
          // console.debug("LOW risk tx", tx.hash);
        }

        // Log detected rules for debugging
        if (result.rules && result.rules.length > 0) {
          console.log(`📊 TX ${tx.hash.slice(0, 10)}... - Risk: ${result.riskLevel}, Confidence: ${result.confidence}, Rules: ${result.rules.join(", ")}`);
          
          // Log enhanced data if available
          if (result.enhancedData) {
            console.log(`   └─ Impact: ${result.enhancedData.priceImpactPct.toFixed(3)}%, Size: ${result.enhancedData.relativeSizePct.toFixed(3)}%`);
          }
        }

        // Store only high-confidence alerts
        if (result.confidence >= CONFIDENCE_THRESHOLD) {
          try {
            const row = await insertAlert({
              txHash: result.txHash,
              from: result.from,
              to: result.to,
              riskLevel: result.riskLevel,
              confidence: result.confidence,
              rules: result.rules,
              estLossUsd: result.estLossUsd,
              slippagePct: result.slippagePct,
              payload: result.payload
            });
            console.log(`🚨 HIGH-CONFIDENCE ALERT SAVED - TX: ${row.tx_hash}, Risk: ${row.risk_level}, Confidence: ${row.confidence}%`);
            
            // Emit websocket event to frontend if io provided
            if (io && typeof io.emit === "function") {
              io.emit("new_alert", row);
            }
          } catch (dbErr) {
            console.error("DB insert failed:", dbErr.message);
          }
        }
      } catch (err) {
        // getTransaction sometimes fails for extremely fresh pending txs — ignore
        // But log other errors for debugging
        if (err.message && !err.message.includes("could not detect network")) {
          console.error("Error processing tx:", err.message);
        }
      }
    });

  } catch (err) {
    console.error("❌ Failed to connect to Alchemy WSS:", err.message);
    isConnecting = false;
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(() => startMempoolListener(io), 5000);
  }
}

// Export providers for testing/debugging
export function getProviders() {
  return { wsProvider, httpProvider };
}
