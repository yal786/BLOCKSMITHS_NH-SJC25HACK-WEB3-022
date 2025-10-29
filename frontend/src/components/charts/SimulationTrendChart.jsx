// frontend/src/components/charts/SimulationTrendChart.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SimulationTrendChart({ data = [] }) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">📈</div>
        <div>
          <h3 className="text-xl font-bold text-white">Simulation Trend</h3>
          <p className="text-slate-400 text-sm">Transactions over time (last 60 minutes)</p>
        </div>
      </div>

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
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#00bcd4" 
            strokeWidth={3}
            dot={{ fill: '#00bcd4', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {data.length === 0 && (
        <div className="flex items-center justify-center h-64 text-slate-500">
          No simulation data available
        </div>
      )}
    </div>
  );
}
