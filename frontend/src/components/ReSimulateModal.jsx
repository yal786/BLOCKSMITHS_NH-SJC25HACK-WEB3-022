import React, { useState, useEffect } from "react";
import { api } from "../services/api";

const ReSimulateModal = ({ txHash, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [simResult, setSimResult] = useState(null);

  // Auto-run simulation when modal opens
  useEffect(() => {
    if (txHash) {
      runSimulation();
    }
  }, [txHash]);

  const runSimulation = async () => {
    if (!txHash || !txHash.startsWith("0x")) {
      setError("Invalid transaction hash");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSimResult(null);

    try {
      console.log("🔍 Running re-simulation for hash:", txHash);
      
      const response = await api.post("/v1/simulate", { txHash });

      if (response.data.ok) {
        console.log("✅ Simulation completed successfully");
        setSimResult(response.data);
        setResult("✅ Simulation completed successfully!");
      } else {
        setError(response.data.error || "Simulation failed");
      }
    } catch (err) {
      console.error("❌ Simulation error:", err);
      setError(err.response?.data?.error || err.message || "Failed to simulate transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border-2 border-cyan-500/30">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-slate-700 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                🔁 Re-simulate Transaction
              </h2>
              <p className="text-slate-300 text-sm mt-2">
                Running simulation for transaction hash
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-3xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Hash Display */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Transaction Hash:</div>
            <div className="font-mono text-sm text-white break-all bg-slate-900 p-3 rounded">
              {txHash}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-3xl">🔬</div>
                </div>
              </div>
              <p className="text-cyan-400 text-lg font-semibold mt-6 animate-pulse">
                Running Simulation...
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Fetching transaction data and analyzing with Tenderly
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="bg-red-900/40 border-2 border-red-500 rounded-xl p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="text-4xl">❌</div>
                <div className="flex-1">
                  <p className="text-red-300 font-bold text-lg mb-2">Simulation Error</p>
                  <p className="text-red-200 text-sm">{error}</p>
                  <button
                    onClick={runSimulation}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    🔄 Retry Simulation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {result && !error && !loading && (
            <div className="bg-green-900/40 border-2 border-green-500 rounded-xl p-5 shadow-lg shadow-green-500/20">
              <div className="flex items-center gap-3">
                <div className="text-3xl">✅</div>
                <p className="text-green-300 font-semibold text-lg">{result}</p>
              </div>
            </div>
          )}

          {/* Simulation Results */}
          {simResult && simResult.simulation && !loading && (
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-8 border-2 border-green-500/30 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">📊</div>
                <h3 className="text-2xl font-bold text-white">
                  Simulation Results
                </h3>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Execution Status */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-green-500/50 transition-all">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                    Status
                  </div>
                  <div className={`text-xl font-bold ${
                    simResult.simulation.execution_status === "success" 
                      ? "text-green-400" 
                      : "text-red-400"
                  }`}>
                    {simResult.simulation.execution_status === "success" 
                      ? "✅ Success" 
                      : "❌ Reverted"}
                  </div>
                  {simResult.simulation.revert_reason && (
                    <div className="text-xs text-red-300 mt-2">
                      {simResult.simulation.revert_reason}
                    </div>
                  )}
                </div>

                {/* Gas Used */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                    Gas Used
                  </div>
                  <div className="text-xl font-bold text-cyan-400">
                    {simResult.simulation.gas_used?.toLocaleString() || "N/A"}
                  </div>
                </div>

                {/* Estimated Loss */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-red-500/50 transition-all">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                    Estimated Loss
                  </div>
                  <div className="text-xl font-bold text-red-400">
                    ${simResult.simulation.estimated_loss_usd?.toFixed(2) || "0.00"}
                  </div>
                </div>

                {/* Attacker Profit */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-orange-500/50 transition-all">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                    Attacker Profit
                  </div>
                  <div className="text-xl font-bold text-orange-400">
                    ${simResult.simulation.attacker_profit_usd?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </div>

              {/* Slippage - Full Width */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-yellow-500/50 transition-all mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                      Slippage
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {simResult.simulation.slippage_percent?.toFixed(2) || "0.00"}%
                    </div>
                  </div>
                  <div className="text-5xl">📉</div>
                </div>
              </div>

              {/* Tenderly Link */}
              {simResult.simulation.tenderly_url && (
                <a
                  href={simResult.simulation.tenderly_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-center font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/50 text-lg transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span>🔗 View Full Simulation on Tenderly</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              )}

              {/* Transaction Details */}
              {simResult.transaction && (
                <div className="mt-6 bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <div className="text-slate-400 text-sm mb-2">Transaction Details:</div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">From:</span>
                      <div className="text-slate-300 font-mono break-all">
                        {simResult.transaction.from}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">To:</span>
                      <div className="text-slate-300 font-mono break-all">
                        {simResult.transaction.to}
                      </div>
                    </div>
                    {simResult.transaction.blockNumber && (
                      <div>
                        <span className="text-slate-500">Block:</span>
                        <div className="text-slate-300 font-mono">
                          {simResult.transaction.blockNumber}
                        </div>
                      </div>
                    )}
                    {simResult.transaction.value && (
                      <div>
                        <span className="text-slate-500">Value:</span>
                        <div className="text-slate-300 font-mono">
                          {simResult.transaction.value}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw Response (Collapsible) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                  Show Raw Response
                </summary>
                <pre className="mt-3 bg-slate-900 p-4 rounded-lg text-xs text-slate-300 overflow-x-auto max-h-64 border border-slate-700">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Info Box */}
          {!loading && !simResult && !error && (
            <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="text-cyan-400 text-2xl">💡</div>
                <div>
                  <div className="font-bold text-cyan-300 mb-2">How it works:</div>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>Transaction hash is used to fetch full transaction details from blockchain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>Simulation runs on Tenderly to analyze execution and identify risks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>Results show gas costs, potential losses, and attack vectors</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-t border-slate-700 flex justify-end gap-3">
          {simResult && (
            <button
              onClick={runSimulation}
              disabled={loading}
              className="px-6 py-3 rounded-lg border border-cyan-700 hover:bg-cyan-900/30 text-cyan-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Re-run Simulation
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReSimulateModal;
