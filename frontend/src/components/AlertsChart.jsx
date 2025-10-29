import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function AlertsChart({ series }) {
  // series example: [{ time: '10:02', count: 3 }, ...]
  if (!series || !series.length) return <div className="text-slate-400">No chart data yet</div>;
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <LineChart data={series}>
          <CartesianGrid stroke="#233240" />
          <XAxis dataKey="time" stroke="#9aa8b6"/>
          <YAxis stroke="#9aa8b6" />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#2dd4bf" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
