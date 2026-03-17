import React from "react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DataSensor({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <p>No sensor data available</p>;
  }

  // 🔥 Limit to last 200 points
  const limited = data.slice(-200);

  const formattedData = limited.map((item) => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="data-sensor-chart" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <ReLineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#007bff"
            name="Temperature (°C)"
          />

          <Line
            type="monotone"
            dataKey="humidity"
            stroke="#28a745"
            name="Humidity (%)"
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
