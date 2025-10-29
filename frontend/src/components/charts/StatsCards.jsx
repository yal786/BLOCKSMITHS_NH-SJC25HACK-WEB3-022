// frontend/src/components/charts/StatsCards.jsx
import React from "react";

export default function StatsCards({ stats = {} }) {
  const {
    totalEvents = 0,
    totalSimulations = 0,
    totalProtections = 0,
    totalLoss = "0.00",
    totalProfit = "0.00",
    avgGas = 0
  } = stats;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Total Events */}
      <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border border-cyan-700/30 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-cyan-400 text-sm uppercase tracking-wide mb-2">Total Events</div>
            <div className="text-4xl font-bold text-white">{totalEvents.toLocaleString()}</div>
            <div className="text-cyan-300 text-xs mt-2">
              {totalSimulations} simulations · {totalProtections} protections
            </div>
          </div>
          <div className="text-5xl opacity-20">📊</div>
        </div>
      </div>

      {/* Total Loss */}
      <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-700/30 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-red-400 text-sm uppercase tracking-wide mb-2">Total Loss Detected</div>
            <div className="text-4xl font-bold text-white">${parseFloat(totalLoss).toLocaleString()}</div>
            <div className="text-red-300 text-xs mt-2">
              MEV extraction detected
            </div>
          </div>
          <div className="text-5xl opacity-20">💸</div>
        </div>
      </div>

      {/* Average Gas */}
      <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-purple-400 text-sm uppercase tracking-wide mb-2">Avg Gas Used</div>
            <div className="text-4xl font-bold text-white">{parseInt(avgGas).toLocaleString()}</div>
            <div className="text-purple-300 text-xs mt-2">
              Per transaction
            </div>
          </div>
          <div className="text-5xl opacity-20">⛽</div>
        </div>
      </div>
    </div>
  );
}
