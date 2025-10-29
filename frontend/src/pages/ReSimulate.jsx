import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import Navbar from "../components/Navbar";

const ReSimulate = () => {
  const [txHash, setTxHash] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [gas, setGas] = useState("");
  const [gasPrice, setGasPrice] = useState("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedData, setFetchedData] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill transaction hash from localStorage on mount
  useEffect(() => {
    const lastTxHash = localStorage.getItem("lastProtectedTxHash");
    if (lastTxHash) {
      console.log("🔄 Auto-filling transaction hash:", lastTxHash);
      setTxHash(lastTxHash);
      setAutoFilled(true);
      // Clear localStorage after retrieving
      localStorage.removeItem("lastProtectedTxHash");
    }
  }, []);

  const fetchByHash = async () => {
    if (!txHash || !txHash.startsWith("0x")) {
      setError("Please enter a valid transaction hash (starts with 0x)");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSimResult(null);

    try {
      console.log("🔍 Fetching and re-simulating transaction:", txHash);
      
      const response = await api.post("/v1/simulate", { txHash });

      if (response.data.ok && response.data.mode === "hash") {
        const tx = response.data.transaction;
        const sim = response.data.simulation;
        
        // Auto-populate fields
        setFrom(tx.from || "");
        setTo(tx.to || "");
        setValue(tx.value || "0x0");
        setGas(tx.gas || "");
        setGasPrice(tx.gasPrice || "");
        setInput(tx.input || "0x");
        
        setFetchedData(tx);
        
        // Set simulation result
        if (sim) {
          setSimResult({
            ok: true,
            simulation: sim,
          });
          setResult("✅ Transaction fetched and re-simulation completed successfully!");
        } else {
          setResult("✅ Transaction data fetched and fields populated!");
        }
      } else {
        setError(response.data.error || "Failed to fetch transaction");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.error || err.message || "Failed to fetch transaction");
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!from || !to) {
      setError("Please provide at least 'from' and 'to' addresses");
      return;
    }

    setLoading(true);
    setError(null);
    setSimResult(null);

    try {
      console.log("Running simulation...");
      
      // Build transaction object
      const tx = {
        from,
        to,
        value: value || "0x0",
        gas: gas || "50000",
        gasPrice: gasPrice || "0",
        data: input || "0x",
      };

      const response = await api.post("/v1/simulate", {
        tx,
        alertTxHash: txHash || null,
      });

      if (response.data.ok) {
        setSimResult(response.data);
        setResult("✅ Simulation completed successfully!");
      } else {
        setError(response.data.error || "Simulation failed");
      }
    } catch (err) {
      console.error("Simulation error:", err);
      setError(err.response?.data?.error || err.message || "Failed to simulate transaction");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setTxHash("");
    setFrom("");
    setTo("");
    setValue("");
    setGas("");
    setGasPrice("");
    setInput("");
    setResult(null);
    setSimResult(null);
    setError(null);
    setFetchedData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-3">
              🔁 Re-Simulate Transaction
            </h1>
            <p className="text-slate-300 text-lg">
              Enter a transaction hash to fetch and re-simulate the transaction
            </p>
          </div>

          {/* Auto-fill notification */}
          {autoFilled && (
            <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-2 border-cyan-500 rounded-xl p-4 mb-6 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="text-2xl">✨</div>
                <div>
                  <p className="text-cyan-300 font-semibold">Auto-filled from Protected Transaction</p>
                  <p className="text-cyan-200 text-sm">The transaction hash has been automatically filled from your last protection request</p>
                </div>
                <button
                  onClick={() => setAutoFilled(false)}
                  className="ml-auto text-cyan-400 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Main Hash Input Section - PROMINENT */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 mb-6 border-2 border-cyan-500/30 shadow-2xl">
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-white mb-3">
                  📝 Transaction Hash
                </label>
                <input
                  className="w-full bg-slate-900 border-2 border-slate-600 rounded-xl p-4 text-white font-mono text-base focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  placeholder="Paste transaction hash here (e.g., 0xf180c6dbbbbe173c2b483526c40f0a5abc317fb924ce75311338ed09ee298e4a)"
                  value={txHash}
                  onChange={(e) => {
                    setTxHash(e.target.value);
                    setAutoFilled(false);
                  }}
                  autoFocus
                />
                <p className="text-slate-400 text-sm mt-2">
                  💡 Paste any Ethereum mainnet transaction hash to analyze
                </p>
              </div>

              <button
                onClick={fetchByHash}
                disabled={loading || !txHash}
                className="w-full py-4 text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/50 disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing... Please wait
                  </span>
                ) : (
                  "🚀 Fetch & Re-Simulate Transaction"
                )}
              </button>
            </div>
          </div>

          {/* Advanced Options - Collapsible */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-750 rounded-xl p-4 border border-slate-700 transition-colors"
            >
              <span className="text-white font-semibold">
                ⚙️ Advanced Options (Manual Input)
              </span>
              <svg
                className={`w-5 h-5 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="bg-slate-800 rounded-xl p-6 mt-2 border border-slate-700">
                <p className="text-sm text-slate-400 mb-4">
                  Manually enter transaction details or edit auto-populated fields before running simulation.
                </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  From Address
                </label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="0x..."
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  To Address
                </label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="0x..."
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Value (hex or wei)
                </label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="0x0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gas Limit
                </label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="50000"
                  value={gas}
                  onChange={(e) => setGas(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gas Price (optional)
                </label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="0"
                  value={gasPrice}
                  onChange={(e) => setGasPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Input Data
              </label>
              <textarea
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs h-32 focus:border-cyan-500 focus:outline-none"
                placeholder="0x..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={runSimulation}
                disabled={loading || !from || !to}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? "⏳ Simulating..." : "🚀 Run Simulation"}
              </button>

              <button
                onClick={clearAll}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                🗑️ Clear All
              </button>
            </div>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {result && !error && (
            <div className="bg-green-900/40 border-2 border-green-500 rounded-xl p-5 mb-6 shadow-lg shadow-green-500/20">
              <div className="flex items-center gap-3">
                <div className="text-3xl">✅</div>
                <p className="text-green-300 font-semibold text-lg">{result}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/40 border-2 border-red-500 rounded-xl p-5 mb-6 shadow-lg shadow-red-500/20 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="text-3xl">❌</div>
                <div>
                  <p className="text-red-300 font-semibold text-lg">Error</p>
                  <p className="text-red-200 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Fetched Data Display */}
          {fetchedData && (
            <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">
                📋 Fetched Transaction Data
              </h3>
              <div className="bg-slate-900 p-4 rounded-lg">
                <pre className="text-xs text-slate-300 overflow-x-auto">
                  {JSON.stringify(fetchedData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Simulation Results */}
          {simResult && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border-2 border-green-500/30 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">📊</div>
                <h3 className="text-2xl font-bold text-white">
                  Simulation Results
                </h3>
              </div>

              {simResult.simulation && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-green-500/50 transition-all">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Status</div>
                      <div className={`text-xl font-bold ${simResult.simulation.execution_status === "success" ? "text-green-400" : "text-red-400"}`}>
                        {simResult.simulation.execution_status === "success" ? "✅ Success" : "❌ Reverted"}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Gas Used</div>
                      <div className="text-xl font-bold text-cyan-400">
                        {simResult.simulation.gas_used?.toLocaleString() || "N/A"}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-red-500/50 transition-all">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Est. Loss</div>
                      <div className="text-xl font-bold text-red-400">
                        ${simResult.simulation.estimated_loss_usd?.toFixed(2) || "0.00"}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 hover:border-yellow-500/50 transition-all">
                      <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Slippage</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {simResult.simulation.slippage_percent?.toFixed(2) || "0.00"}%
                      </div>
                    </div>
                  </div>

                  {simResult.simulation.tenderly_url && (
                    <a
                      href={simResult.simulation.tenderly_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-center font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/50 text-lg transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>🔗 View Full Trace on Tenderly</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  )}

                  <div className="bg-slate-900 p-4 rounded-lg">
                    <div className="text-slate-400 text-sm mb-2">Raw Response:</div>
                    <pre className="text-xs text-slate-300 overflow-x-auto max-h-96">
                      {JSON.stringify(simResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="text-cyan-400 text-2xl">💡</div>
              <div>
                <div className="font-bold text-cyan-300 mb-2 text-base">Quick Start Guide:</div>
                <ol className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-cyan-400 mt-0.5">1.</span>
                    <span>Copy any Ethereum mainnet transaction hash</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-cyan-400 mt-0.5">2.</span>
                    <span>Paste it in the field above</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-cyan-400 mt-0.5">3.</span>
                    <span>Click "Fetch & Re-Simulate Transaction"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-cyan-400 mt-0.5">4.</span>
                    <span>View detailed analysis instantly!</span>
                  </li>
                </ol>
                <div className="mt-3 pt-3 border-t border-cyan-500/20">
                  <p className="text-xs text-slate-400">
                    <strong className="text-cyan-400">Example hash:</strong>{" "}
                    <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300">
                      0xf180c6dbbbbe173c2b483526c40f0a5abc317fb924ce75311338ed09ee298e4a
                    </code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReSimulate;
