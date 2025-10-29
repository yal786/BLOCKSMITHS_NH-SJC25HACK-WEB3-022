import React, { useState } from "react";
import { api } from "../services/api";

export default function SimulationPanel({ alert, onClose }) {
  const [tx, setTx] = useState({
    from: alert?.from || "",
    to: alert?.to || "",
    value: alert?.payload?.value || "0x0",
    data: alert?.payload?.data || alert?.payload?.input || "0x",
    gasLimit: alert?.payload?.gas || alert?.payload?.gasLimit || "8000000",
    maxFeePerGas: alert?.payload?.maxFeePerGas || alert?.payload?.gasPrice || "",
    chainId: "1",
    nonce: alert?.payload?.nonce || "",
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    // Frontend validation
    if (!tx.to || !tx.to.startsWith("0x")) {
      setError("Invalid To address: must start with 0x");
      setLoading(false);
      return;
    }
    
    if (!tx.data || !tx.data.startsWith("0x")) {
      setError("Invalid data format: must start with 0x");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Running simulation for:", alert?.tx_hash);
      console.log("Transaction data:", tx);
      
      // Ensure value is in hex format - handle large numbers properly
      let hexValue = "0x0";
      if (tx.value) {
        if (tx.value.startsWith("0x")) {
          hexValue = tx.value;
        } else {
          // Convert large number string to BigInt then to hex
          try {
            hexValue = "0x" + BigInt(tx.value).toString(16);
          } catch (e) {
            hexValue = "0x0";
          }
        }
      }
      
      const txPayload = {
        from: tx.from,
        to: tx.to,
        data: tx.data,
        value: hexValue,
        gasLimit: parseInt(tx.gasLimit || 50000),
        maxFeePerGas: parseInt(tx.maxFeePerGas || 999000000000),
        chainId: parseInt(tx.chainId || 1),
      };
      
      const response = await api.post("/v1/simulate", {
        tx: txPayload,
        alertTxHash: alert?.tx_hash,
      });

      console.log("Simulation response:", response.data);

      if (response.data.ok) {
        setResult(response.data.simulation);
      } else {
        setError(response.data.error || "Simulation failed");
      }
    } catch (err) {
      console.error("Simulation error:", err);
      setError(err.response?.data?.error || err.message || "Simulation failed");
      
      // If we get a fallback response, show it
      if (err.response?.data?.simulation) {
        setResult(err.response.data.simulation);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🔬 Re-simulate Transaction</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          {alert?.tx_hash && (
            <div className="mt-2 text-sm text-slate-400">
              TX: {alert.tx_hash.slice(0, 10)}...{alert.tx_hash.slice(-8)}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">From Address</label>
              <input
                value={tx.from}
                onChange={(e) => setTx({ ...tx, from: e.target.value })}
                placeholder="0x..."
                className="w-full bg-slate-800 p-3 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">To Address</label>
              <input
                value={tx.to}
                onChange={(e) => setTx({ ...tx, to: e.target.value })}
                placeholder="0x..."
                className="w-full bg-slate-800 p-3 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Value (wei)</label>
                <input
                  value={tx.value}
                  onChange={(e) => setTx({ ...tx, value: e.target.value })}
                  placeholder="0x0"
                  className="w-full bg-slate-800 p-3 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Gas Limit</label>
                <input
                  value={tx.gasLimit}
                  onChange={(e) => setTx({ ...tx, gasLimit: e.target.value })}
                  placeholder="8000000"
                  className="w-full bg-slate-800 p-3 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Max Fee Per Gas</label>
                <input
                  value={tx.maxFeePerGas}
                  onChange={(e) => setTx({ ...tx, maxFeePerGas: e.target.value })}
                  placeholder="30000000000"
                  className="w-full bg-slate-800 p-3 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Chain ID</label>
                <input
                  value={tx.chainId}
                  onChange={(e) => setTx({ ...tx, chainId: e.target.value })}
                  placeholder="1"
                  className="w-full bg-slate-800 p-3 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Data</label>
              <textarea
                value={tx.data}
                onChange={(e) => setTx({ ...tx, data: e.target.value })}
                placeholder="0x..."
                rows={3}
                className="w-full bg-slate-800 p-3 rounded border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className={`mt-6 w-full py-3 rounded font-semibold ${
              loading
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-700 text-white"
            }`}
          >
            {loading ? "⏳ Running Simulation..." : "🔬 Run Simulation"}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded">
              <p className="text-red-400">❌ {error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="font-bold text-lg mb-4 text-cyan-400">📊 Simulation Results</h3>
                
                {/* Execution Status */}
                {result.execution_status && (
                  <div className={`p-4 rounded mb-4 ${
                    result.execution_status === "success" 
                      ? "bg-green-900/30 border border-green-700" 
                      : "bg-red-900/30 border border-red-700"
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`text-xl ${
                        result.execution_status === "success" ? "text-green-400" : "text-red-400"
                      }`}>
                        {result.execution_status === "success" ? "✅" : "❌"}
                      </div>
                      <div>
                        <div className="font-bold">
                          Execution Status: {result.execution_status === "success" ? "Success" : "Reverted"}
                        </div>
                        {result.revert_reason && (
                          <div className="text-sm text-red-300 mt-1">
                            Reason: {result.revert_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gas Used */}
                {result.gas_used !== undefined && (
                  <div className="p-3 bg-slate-900 rounded mb-4">
                    <div className="text-slate-400 text-sm">⚙️ Gas Used</div>
                    <div className="text-white font-mono text-xl">
                      {result.gas_used.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900 p-4 rounded">
                    <div className="text-slate-400 text-sm mb-1">💰 Estimated Loss</div>
                    <div className="text-2xl font-bold text-red-400">
                      ${result.estimated_loss_usd?.toFixed(2) || "0.00"}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded">
                    <div className="text-slate-400 text-sm mb-1">🎯 Attacker Profit</div>
                    <div className="text-2xl font-bold text-orange-400">
                      ${result.attacker_profit_usd?.toFixed(2) || "0.00"}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded">
                    <div className="text-slate-400 text-sm mb-1">📉 Slippage</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {result.slippage_percent?.toFixed(2) || "0.00"}%
                    </div>
                  </div>
                </div>

                {/* Tenderly Link */}
                {(result.tenderly_url || result.sim_url) && (
                  <div className="mt-4">
                    <a
                      href={result.tenderly_url || result.sim_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded"
                    >
                      🔗 View Full Simulation on Tenderly →
                    </a>
                  </div>
                )}

                {result.simulation_id && (
                  <div className="mt-3 text-xs text-slate-500">
                    Simulation ID: {result.simulation_id}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
