import React, { useState } from "react";
import { ethers } from "ethers";
import { api } from "../services/api";

const ProtectModal = ({ alert, onClose }) => {
  const [txData, setTxData] = useState("");
  const [alertHash, setAlertHash] = useState(alert?.tx_hash || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Demo private key (Hardhat account #0 - NEVER use on mainnet!)
  const demoPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  const signDemoTx = async () => {
    try {
      console.log("Signing demo transaction...");
      
      const wallet = new ethers.Wallet(demoPrivateKey);
      
      // Build transaction object from alert data
      const txObject = {
        to: alert?.to || "0x0000000000000000000000000000000000000000",
        value: ethers.parseEther("0.001"), // 0.001 ETH
        gasLimit: 50000,
        maxFeePerGas: ethers.parseUnits("50", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        chainId: 1, // Mainnet
        nonce: 0,
        type: 2, // EIP-1559
      };

      const signed = await wallet.signTransaction(txObject);
      setTxData(signed);
      setError(null);
      
      console.log("Transaction signed:", signed.slice(0, 20) + "...");
    } catch (err) {
      console.error("Sign error:", err);
      setError("Failed to sign demo transaction: " + err.message);
    }
  };

  const sendToProtect = async () => {
    if (!txData || !txData.startsWith("0x")) {
      setError("Please paste or sign a valid transaction first!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("Sending to Flashbots Protect...");
      
      const response = await api.post("/v1/protect", {
        signedRawTx: txData,
        alertTxHash: alertHash,
      });

      console.log("Protect response:", response.data);

      if (response.data.ok) {
        setResult(response.data);
        
        // Store the protected txHash in localStorage for auto-fill in Re-simulate
        if (response.data.result) {
          localStorage.setItem("lastProtectedTxHash", response.data.result);
          console.log("📝 Stored txHash for re-simulation:", response.data.result);
        }
      } else {
        setError(response.data.error || "Protection failed");
      }
    } catch (err) {
      console.error("Protect error:", err);
      setError(err.response?.data?.error || err.message || "Failed to protect transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl text-white">
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🛡️ Protect Transaction
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Send transaction privately via Flashbots to avoid frontrunning
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Alert TX Hash */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Alert Transaction Hash (Optional)
            </label>
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm font-mono focus:border-cyan-500 focus:outline-none"
              value={alertHash}
              onChange={(e) => setAlertHash(e.target.value)}
              placeholder="0x..."
            />
          </div>

          {/* Signed Transaction */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Signed Raw Transaction
            </label>
            <textarea
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 h-32 text-xs font-mono focus:border-cyan-500 focus:outline-none"
              value={txData}
              onChange={(e) => setTxData(e.target.value)}
              placeholder="Paste signed raw transaction (0xf86b...) or use 'Sign Demo TX' button"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={signDemoTx}
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg font-semibold transition-colors"
            >
              📝 Sign Demo TX
            </button>

            <button
              onClick={sendToProtect}
              disabled={loading || !txData}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg font-semibold transition-colors"
            >
              {loading ? "⏳ Protecting..." : "🚀 Send to Flashbots"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">❌ {error}</p>
            </div>
          )}

          {/* Success Result */}
          {result && (
            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-bold text-green-400">
                    Transaction Protected Successfully!
                  </div>
                  <div className="text-sm text-green-300 mt-1">
                    {result.message || "Sent via Flashbots"}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-3 rounded">
                <div className="text-slate-400 text-xs mb-1">Transaction Hash:</div>
                <div className="font-mono text-sm break-all">{result.result}</div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-slate-800 rounded text-slate-300">
                  Mode: {result.mode}
                </span>
                {result.mode === "demo" && (
                  <span className="text-yellow-400 text-xs">
                    ⚠️ Demo mode - Switch to real in production
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-3 bg-cyan-900/20 border border-cyan-700/50 rounded text-sm text-cyan-200">
            <div className="font-bold mb-1">ℹ️ How it works:</div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Sign your transaction locally or paste signed raw TX</li>
              <li>Transaction sent to Flashbots RPC (private mempool)</li>
              <li>MEV searchers can't frontrun your transaction</li>
              <li>Currently in <strong>demo mode</strong> for testing</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProtectModal;
