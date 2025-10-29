// frontend/src/components/TransactionBuilder.jsx
// Manual transaction builder with simulation and risk preview
import React, { useState } from 'react';
import { api } from '../services/api';

export default function TransactionBuilder() {
  const [form, setForm] = useState({
    from: '',
    to: '',
    tokenIn: '',
    tokenOut: '',
    amount: '',
    slippage: '0.5',
    gasLimit: '300000',
    mode: 'quick',
  });

  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const runSimulation = async () => {
    if (!form.to) {
      setError('Please enter a contract address');
      return;
    }

    setSimulating(true);
    setError(null);
    setResult(null);

    try {
      // Build transaction data (simplified for demo)
      const txData = {
        from: form.from || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        to: form.to,
        data: '0x', // Would be encoded swap data in production
        value: '0x0',
        gasLimit: parseInt(form.gasLimit),
        mode: form.mode,
        slippage: parseFloat(form.slippage) / 100,
        tokenDecimals: 18,
        tokenUsdPrice: 2500, // Would fetch real price
        ethUsdPrice: 3000,
      };

      console.log('Simulating transaction:', txData);

      const response = await api.post('/v1/simulate', txData);

      if (response.data.ok) {
        setResult(response.data);
      } else {
        setError(response.data.error || 'Simulation failed');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to simulate');
    } finally {
      setSimulating(false);
    }
  };

  const getRiskColor = (label) => {
    const colors = {
      safe: 'bg-green-600',
      low: 'bg-yellow-500',
      medium: 'bg-orange-500',
      high: 'bg-red-600',
      critical: 'bg-red-800',
    };
    return colors[label] || 'bg-gray-600';
  };

  const getRiskEmoji = (label) => {
    const emojis = {
      safe: '✅',
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '⛔',
    };
    return emojis[label] || '⚠️';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-slate-900 rounded-lg shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🔬 Transaction Builder & Simulator
          </h2>
          <p className="text-slate-400 mt-2">
            Build and simulate your transaction to preview MEV risks before sending
          </p>
        </div>

        <div className="p-6">
          {/* Form */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-slate-300 text-sm mb-2">From Address</label>
              <input
                type="text"
                name="from"
                value={form.from}
                onChange={handleChange}
                placeholder="0x... (optional)"
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">To Contract *</label>
              <input
                type="text"
                name="to"
                value={form.to}
                onChange={handleChange}
                placeholder="0x... (Router/Contract)"
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Token In</label>
              <input
                type="text"
                name="tokenIn"
                value={form.tokenIn}
                onChange={handleChange}
                placeholder="ETH, USDC, WETH..."
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Token Out</label>
              <input
                type="text"
                name="tokenOut"
                value={form.tokenOut}
                onChange={handleChange}
                placeholder="DAI, USDT, WBTC..."
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Amount</label>
              <input
                type="text"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="1.0"
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Slippage Tolerance (%)</label>
              <input
                type="text"
                name="slippage"
                value={form.slippage}
                onChange={handleChange}
                placeholder="0.5"
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Gas Limit</label>
              <input
                type="text"
                name="gasLimit"
                value={form.gasLimit}
                onChange={handleChange}
                placeholder="300000"
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Simulation Mode</label>
              <select
                name="mode"
                value={form.mode}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-cyan-500 focus:outline-none"
              >
                <option value="quick">Quick (Fast estimate)</option>
                <option value="deep">Deep (Full trace)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={runSimulation}
              disabled={simulating || !form.to}
              className={`flex-1 px-6 py-3 rounded font-semibold ${
                simulating || !form.to
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {simulating ? '⏳ Simulating...' : '🔬 Simulate Transaction'}
            </button>

            <button
              onClick={() => {
                setForm({
                  from: '',
                  to: '',
                  tokenIn: '',
                  tokenOut: '',
                  amount: '',
                  slippage: '0.5',
                  gasLimit: '300000',
                  mode: 'quick',
                });
                setResult(null);
                setError(null);
              }}
              className="px-6 py-3 rounded border border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Clear
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded">
              <div className="text-red-400">❌ {error}</div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-slate-800 rounded border-l-4 border-cyan-500">
                <h3 className="text-lg font-bold text-white mb-4">
                  Simulation Results
                </h3>

                {/* Risk Summary */}
                <div className={`p-4 rounded ${getRiskColor(result.riskLabel)} bg-opacity-20 mb-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {getRiskEmoji(result.riskLabel)} {result.riskLabel?.toUpperCase()} RISK
                      </div>
                      <div className="text-sm text-slate-300 mt-1">
                        {result.formatted?.summary}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Confidence</div>
                      <div className="text-xl font-bold text-white">
                        {(result.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-slate-900 rounded">
                    <div className="text-slate-400 text-sm">Estimated Slippage</div>
                    <div className="text-2xl font-bold text-yellow-400 mt-1">
                      {result.estSlippagePct?.toFixed(2)}%
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded">
                    <div className="text-slate-400 text-sm">Estimated Loss</div>
                    <div className="text-2xl font-bold text-red-400 mt-1">
                      ${result.estLossUsd?.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded">
                    <div className="text-slate-400 text-sm">Gas Cost</div>
                    <div className="text-2xl font-bold text-slate-300 mt-1">
                      ${result.gasCostUsd?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* MEV Risk */}
                {result.isProfitableAttack && (
                  <div className="p-4 bg-red-900/30 border border-red-700 rounded mb-4">
                    <div className="font-bold text-red-400 mb-2">
                      ⚠️ MEV Attack Profitable
                    </div>
                    <div className="text-sm text-red-300">
                      Attacker Profit: ${result.attackerProfitUsd?.toFixed(2)} (Net: ${result.netAttackerProfit?.toFixed(2)})
                    </div>
                    <div className="text-xs text-red-400 mt-2">
                      This transaction is vulnerable to sandwich attacks. Consider using MEV protection.
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="p-4 bg-cyan-900/20 border border-cyan-700 rounded mb-4">
                    <div className="font-bold text-cyan-300 mb-2">💡 Recommendations</div>
                    <ul className="space-y-1">
                      {result.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-cyan-200">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Transaction Status */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-slate-400">Will Succeed: </span>
                    <span className={result.willSucceed ? 'text-green-400' : 'text-red-400'}>
                      {result.willSucceed ? '✅ Yes' : '❌ Likely to fail'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Mode: </span>
                    <span className="text-white font-mono">{result.mode}</span>
                  </div>
                </div>

                {/* Trace URL */}
                {result.traceUrl && (
                  <div className="mb-4">
                    <a
                      href={result.traceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded inline-block"
                    >
                      View Full Trace on Tenderly →
                    </a>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  {result.riskLabel === 'safe' || result.riskLabel === 'low' ? (
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold">
                      ✅ Proceed to Send
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-semibold">
                      🛡️ Use MEV Protection
                    </button>
                  )}
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded"
                  >
                    Edit Transaction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
