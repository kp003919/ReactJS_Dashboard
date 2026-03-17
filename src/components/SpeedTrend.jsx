import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function SpeedTrend({ history }) {
  // Convert history → chart data
  const data = useMemo(() => {
    if (!history || history.length === 0) return [];

    return history.slice(-20).map((point, index) => ({
      name: index + 1,
      speed: point.speed || 0
    }));
  }, [history]);

  if (data.length === 0) {
    return <p>No speed data available</p>;
  }

  return (
    <div className="speed-trend-card">
      <h3>Speed Trend (Last 20 Samples)</h3>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="name" stroke="#ccc" />
          <YAxis stroke="#ccc" domain={[0, "auto"]} />
          <Tooltip
            contentStyle={{ background: "#222", border: "1px solid #555" }}
            labelStyle={{ color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="speed"
            stroke="#00e676"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
