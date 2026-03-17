import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function DHTPage() {
  const [dht, setDht] = useState(null);
  const [prevDht, setPrevDht] = useState(null);
  const [history, setHistory] = useState([]);
  const [offline, setOffline] = useState(false);

  // Convert timestamp → "X hours Y minutes ago"
  const timeAgo = (lastSeen) => {
    if (!lastSeen) return "—";

    const now = Date.now();
    const diffMs = now - lastSeen;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 1) return "just now";
    if (diffSec < 60) return `${diffSec} seconds ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;
    }

    const diffHours = Math.floor(diffMin / 60);
    const remainingMin = diffMin % 60;

    if (diffHours < 24) {
      if (remainingMin === 0) return `${diffHours} hours ago`;
      return `${diffHours} hours ${remainingMin} minutes ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (remainingHours === 0) return `${diffDays} days ago`;
    return `${diffDays} days ${remainingHours} hours ago`;
  };

  // Trend detection
  const getTrend = (current, previous) => {
    if (!current || !previous) return { temp: "—", hum: "—" };

    const temp =
      current.temperature > previous.temperature
        ? "rising"
        : current.temperature < previous.temperature
        ? "falling"
        : "stable";

    const hum =
      current.humidity > previous.humidity
        ? "rising"
        : current.humidity < previous.humidity
        ? "falling"
        : "stable";

    return { temp, hum };
  };

  // Alerts
  const getAlerts = (dht) => {
    if (!dht) return [];

    const alerts = [];
    if (dht.temperature > 30) alerts.push("High temperature detected");
    if (dht.temperature < 10) alerts.push("Low temperature detected");
    if (dht.humidity > 70) alerts.push("High humidity detected");
    if (dht.humidity < 20) alerts.push("Low humidity detected");

    return alerts;
  };

  // Offline detection
  useEffect(() => {
    const interval = setInterval(() => {
      if (dht && Date.now() - dht.lastSeen > 5000) {
        setOffline(true);
      } else {
        setOffline(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dht]);

  // Re-render every second for timeAgo()
  useEffect(() => {
    const interval = setInterval(() => {
      setDht((prev) => (prev ? { ...prev } : null));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket
  useEffect(() => {
    // FIXED: Correct WebSocket URL
    const ws = new WebSocket("ws://192.168.0.21:1880/ws/dht");

    ws.onmessage = (event) => {
      console.log("RAW WS:", event.data); // <--- ADD THIS
      try {
        const data = JSON.parse(event.data);

        // FIXED: Correct DHT detection
        if (data.type === "dht") {
          const enriched = {
            ...data,
            lastSeen: Date.now(), // FIXED: Required for offline detection
          };

          setPrevDht((prev) => (dht ? { ...dht } : prev));
          setDht(enriched);

          setHistory((prev) => [
            ...prev.slice(-49),
            {
              time: new Date().toLocaleTimeString(),
              temperature: enriched.temperature,
              humidity: enriched.humidity,
            },
          ]);
        }
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    return () => ws.close();
  }, [dht]);

  const alerts = getAlerts(dht);
  const trend = getTrend(dht, prevDht);

  return (
    <div style={{ padding: 20 }}>
      <h2>DHT Sensor Dashboard</h2>
      <p style={{ marginTop: -5, color: "#888" }}>
        Real‑time temperature & humidity from ESP32 → Node‑RED → WebSocket.
      </p>

      {/* Offline Warning */}
      {offline && (
        <div
          style={{
            background: "#ffe6e6",
            padding: "10px",
            border: "1px solid #ff9999",
            marginTop: "20px",
            color: "#cc0000",
          }}
        >
          ⚠️ No DHT data received for more than 5 seconds
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div
          style={{
            background: "#ffdddd",
            padding: "10px",
            border: "1px solid #ff8888",
            marginTop: "20px",
          }}
        >
          <strong>Alerts:</strong>
          <ul>
            {alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Gauges + Chart Row */}
      {dht && (
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "30px",
            alignItems: "center",
          }}
        >
          {/* Temperature Gauge */}
          <div style={{ width: "200px" }}>
            <h3>Temperature</h3>
            <CircularProgressbar
              value={dht.temperature}
              maxValue={50}
              text={`${dht.temperature}°C`}
              styles={buildStyles({
                pathColor: dht.temperature > 30 ? "red" : "#00bfff",
                textColor: "#000",
                trailColor: "#eee",
              })}
            />
          </div>

          {/* Humidity Gauge */}
          <div style={{ width: "200px" }}>
            <h3>Humidity</h3>
            <CircularProgressbar
              value={dht.humidity}
              maxValue={100}
              text={`${dht.humidity}%`}
              styles={buildStyles({
                pathColor: "#0055ff",
                textColor: "#000",
                trailColor: "#eee",
              })}
            />
          </div>

          {/* Combined Chart */}
          <div style={{ flex: 1, height: "300px" }}>
            <h3>Temperature & Humidity History</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" domain={[0, 50]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  stroke="red"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="humidity"
                  stroke="blue"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      {dht && (
        <table
          border="1"
          cellPadding="6"
          style={{
            marginTop: 30,
            borderCollapse: "collapse",
            width: "350px",
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Temperature</td>
              <td>{dht.temperature} °C</td>
            </tr>
            <tr>
              <td>Humidity</td>
              <td>{dht.humidity} %</td>
            </tr>
            <tr>
              <td>Temperature Trend</td>
              <td>{trend.temp}</td>
            </tr>
            <tr>
              <td>Humidity Trend</td>
              <td>{trend.hum}</td>
            </tr>
            <tr>
              <td>Last Updated</td>
              <td>{timeAgo(dht.lastSeen)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
