// frontend/src/components/charts/RiskPieChart.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
  unknown: '#6b7280'
};

export default function RiskPieChart({ data = {} }) {
  const chartData = [
    { name: 'High Risk', value: data.high || 0, color: COLORS.high },
    { name: 'Medium Risk', value: data.medium || 0, color: COLORS.medium },
    { name: 'Low Risk', value: data.low || 0, color: COLORS.low },
    { name: 'Unknown', value: data.unknown || 0, color: COLORS.unknown }
  ].filter(item => item.value > 0);

  const totalTransactions = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">🎯</div>
        <div>
          <h3 className="text-xl font-bold text-white">Risk Distribution</h3>
          <p className="text-slate-400 text-sm">Total: {totalTransactions} transactions</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-slate-500">
          No risk data available
        </div>
      )}
    </div>
  );
}
