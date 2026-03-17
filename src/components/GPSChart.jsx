import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

export default function GPSChart({ data }) {
  if (!data || data.length === 0) {
    return <p>No chart data yet…</p>;
  }

  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid stroke="#ccc" />
      <XAxis dataKey="time" />
      <YAxis />
      <Tooltip />
      <Legend />

      <Line
        type="monotone"
        dataKey="speed"
        stroke="#ff7300"
        name="Speed (km/h)"
      />

      <Line
        type="monotone"
        dataKey="altitude"
        stroke="#387908"
        name="Altitude (m)"
      />
    </LineChart>
  );
}
