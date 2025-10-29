// frontend/src/components/charts/LossProfitChart.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function LossProfitChart({ data = [] }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">💰</div>
        <div>
          <h3 className="text-xl font-bold text-white">Loss vs Profit Trend</h3>
          <p className="text-slate-400 text-sm">MEV analysis over time (USD)</p>
        </div>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              label={{ value: 'USD', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{ color: '#94a3b8' }}
            />
            <Line 
              type="monotone" 
              dataKey="loss" 
              name="Estimated Loss"
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="profit" 
              name="Attacker Profit"
              stroke="#f59e0b" 
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="slippage" 
              name="Slippage %"
              stroke="#06b6d4" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#06b6d4', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-slate-500">
          No loss/profit data available
        </div>
      )}
    </div>
  );
}
