import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "../css/RTLSRSSIChart.css";

export default function RTLSRSSIChart({ beacons }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!Array.isArray(beacons) || beacons.length === 0) return;

    console.log("Incoming beacons:", beacons);

    const timestamp = new Date().toLocaleTimeString();
    const entry = { time: timestamp };

    beacons.forEach((b) => {
      const key = b.tagMac;   // <-- FIXED
      entry[key] = b.rssi ?? null;
    });

    setHistory((prev) => {
      const updated = [...prev, entry];
      return updated.slice(-20);
    });
  }, [beacons]);

  if (history.length === 0) {
    return <p className="chart-empty">Waiting for RSSI data…</p>;
  }

  return (
    <div style={{ width: "100%", height: "400px", background: "yellow" }}>
      <h3>RSSI Trend (Last 20 Samples)</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <XAxis dataKey="time" />
          <YAxis domain={[-100, 0]} />
          <Tooltip />
          <Legend />

          {beacons.map((b) => {
            const key = b.tagMac;   // <-- FIXED
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke="#007bff"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
