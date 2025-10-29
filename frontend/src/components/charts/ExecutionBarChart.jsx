// frontend/src/components/charts/ExecutionBarChart.jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const COLORS = {
  success: '#10b981',
  reverted: '#ef4444',
  failed: '#f59e0b',
  unknown: '#6b7280'
};

export default function ExecutionBarChart({ data = {} }) {
  const chartData = [
    { name: 'Success', value: data.success || 0, color: COLORS.success },
    { name: 'Reverted', value: data.reverted || 0, color: COLORS.reverted },
    { name: 'Failed', value: data.failed || 0, color: COLORS.failed },
    { name: 'Unknown', value: data.unknown || 0, color: COLORS.unknown }
  ];

  const totalExecutions = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">✅</div>
        <div>
          <h3 className="text-xl font-bold text-white">Execution Status</h3>
          <p className="text-slate-400 text-sm">Total: {totalExecutions} executions</p>
        </div>
      </div>

      {totalExecutions > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="name" 
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
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-slate-500">
          No execution data available
        </div>
      )}
    </div>
  );
}
