// frontend/src/components/charts/ProtectionDonutChart.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = {
  protected: '#10b981',
  failed: '#ef4444'
};

export default function ProtectionDonutChart({ data = {} }) {
  const chartData = [
    { name: 'Protected', value: data.protected || 0, color: COLORS.protected },
    { name: 'Failed', value: data.failed || 0, color: COLORS.failed }
  ].filter(item => item.value > 0);

  const totalProtections = chartData.reduce((sum, item) => sum + item.value, 0);
  const successRate = totalProtections > 0 
    ? ((data.protected || 0) / totalProtections * 100).toFixed(1)
    : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">🛡️</div>
        <div>
          <h3 className="text-xl font-bold text-white">Protection Success Rate</h3>
          <p className="text-slate-400 text-sm">Flashbots protection: {successRate}% success</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
          No protection data available
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
          <div className="text-green-400 text-sm">Protected</div>
          <div className="text-2xl font-bold text-white">{data.protected || 0}</div>
        </div>
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
          <div className="text-red-400 text-sm">Failed</div>
          <div className="text-2xl font-bold text-white">{data.failed || 0}</div>
        </div>
      </div>
    </div>
  );
}
