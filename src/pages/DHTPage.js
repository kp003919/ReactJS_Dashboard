import React, { useContext, useMemo, useState } from "react";
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
import { DHTContext } from "../App";

const TIME_WINDOWS = [
  { key: "10m", label: "Last 10 min", ms: 10 * 60 * 1000 },
  { key: "1h", label: "Last 1 hour", ms: 60 * 60 * 1000 },
  { key: "24h", label: "Last 24 hours", ms: 24 * 60 * 60 * 1000 },
];

const timeAgo = (lastSeen) => {
  if (!lastSeen) return "—";
  const diff = Date.now() - lastSeen;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${min % 60}m ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ${hr % 24}h ago`;
};

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

const getAlerts = (d) => {
  if (!d) return [];
  const alerts = [];
  if (d.temperature > 30) alerts.push("High temperature detected");
  if (d.temperature < 10) alerts.push("Low temperature detected");
  if (d.humidity > 70) alerts.push("High humidity detected");
  if (d.humidity < 20) alerts.push("Low humidity detected");
  return alerts;
};

/**
 * DHT Sensor Dashboard Component 
 * This component displays real-time temperature and humidity data from DHT sensors connected to an ESP32 device. It uses WebSocket to receive live updates and provides a dashboard with gauges, historical charts, and alerts based on sensor readings. The dashboard supports multiple sensors, allowing users to select which sensor's data to view. It also includes a dark mode toggle for improved readability in different lighting conditions. The component is designed to be responsive and visually appealing, making it easy for users to monitor their DHT sensors effectively. 
 *  
 * @returns 
 */
export default function DHTPage() {
  const { sensors, history, wsState } = useContext(DHTContext);
  const [dark, setDark] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0].key);

  const sensorIds = Object.keys(sensors).sort();
  const activeId = selectedId || sensorIds[0] || null;
  const activeSensor = activeId ? sensors[activeId] : null;
  const activeHistory = activeId ? history[activeId] || [] : [];

  const filteredHistory = useMemo(() => {
    const win = TIME_WINDOWS.find((w) => w.key === timeWindow);
    if (!win) return activeHistory;
    const cutoff = Date.now() - win.ms;
    return activeHistory.filter((p) => {
      // p.ts is from device; if missing, approximate with now
      const tsMs = p.ts ? p.ts : Date.now();
      return tsMs >= cutoff;
    });
  }, [activeHistory, timeWindow]);

  const trend = useMemo(() => {
    if (!activeHistory || activeHistory.length < 2) return { temp: "—", hum: "—" };
    const last = activeHistory[activeHistory.length - 1];
    const prev = activeHistory[activeHistory.length - 2];
    return getTrend(
      { temperature: last.temperature, humidity: last.humidity },
      { temperature: prev.temperature, humidity: prev.humidity }
    );
  }, [activeHistory]);

  const alerts = getAlerts(activeSensor);
  const offline =
    activeSensor && Date.now() - activeSensor.lastSeen > 5000;

  const bg = dark ? "#0b1120" : "#f5f5f5";
  const fg = dark ? "#e5e7eb" : "#111827";
  const cardBg = dark ? "#111827" : "#ffffff";
  const subtle = dark ? "#6b7280" : "#6b7280";
  const border = dark ? "#1f2933" : "#e5e7eb";

  if (!activeSensor) {
    return (
      <div
        style={{
          padding: 24,
          maxWidth: 1200,
          margin: "0 auto",
          background: bg,
          minHeight: "100vh",
          color: fg,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>🌡️ DHT Sensor Dashboard</h2>
          <button
            onClick={() => setDark((d) => !d)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: cardBg,
              color: fg,
              cursor: "pointer",
            }}
          >
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>
        <p style={{ color: subtle, marginTop: 8 }}>
          Real‑time temperature & humidity from ESP32 → Node‑RED → WebSocket.
        </p>
        <p style={{ marginTop: 24 }}>Waiting for sensor data...</p>
        {!wsState.connected && (
          <p style={{ color: "#f97373", marginTop: 8 }}>
            WebSocket {wsState.reconnecting ? "reconnecting" : "disconnected"} (attempt {wsState.attempts})
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
        background: bg,
        minHeight: "100vh",
        color: fg,
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>🌡️ DHT Sensor Dashboard</h2>
          <p style={{ color: subtle, marginTop: 4 }}>
            Real‑time temperature & humidity from ESP32 → Node‑RED → WebSocket.
          </p>
          <p style={{ color: subtle, marginTop: 4, fontSize: 13 }}>
            WebSocket:{" "}
            {wsState.connected
              ? "Connected"
              : wsState.reconnecting
              ? `Reconnecting (attempt ${wsState.attempts})`
              : "Disconnected"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={activeId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: cardBg,
              color: fg,
            }}
          >
            {sensorIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <button
            onClick={() => setDark((d) => !d)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: cardBg,
              color: fg,
              cursor: "pointer",
            }}
          >
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>

      {/* Offline + Alerts */}
      {offline && (
        <div
          style={{
            background: dark ? "#451a1a" : "#fee2e2",
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${dark ? "#7f1d1d" : "#fecaca"}`,
            marginBottom: 16,
            color: dark ? "#fecaca" : "#7f1d1d",
          }}
        >
          ⚠️ No DHT data from <strong>{activeId}</strong> for more than 5 seconds
        </div>
      )}

      {alerts.length > 0 && (
        <div
          style={{
            background: dark ? "#422006" : "#fef3c7",
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${dark ? "#92400e" : "#fde68a"}`,
            marginBottom: 16,
            color: dark ? "#fde68a" : "#92400e",
          }}
        >
          <strong>Alerts:</strong>
          <ul style={{ marginTop: 6, paddingLeft: 20 }}>
            {alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Top row: gauges + info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 200px 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Temperature card */}
        <div
          style={{
            background: cardBg,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${border}`,
            boxShadow: dark
              ? "0 10px 30px rgba(0,0,0,0.5)"
              : "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ margin: 0, marginBottom: 8 }}>Temperature</h3>
          <div style={{ width: "100%", maxWidth: 160, margin: "0 auto" }}>
            <CircularProgressbar
              value={activeSensor.temperature}
              maxValue={50}
              text={`${activeSensor.temperature.toFixed(1)}°C`}
              styles={buildStyles({
                pathColor:
                  activeSensor.temperature > 30 ? "#f97373" : "#38bdf8",
                textColor: fg,
                trailColor: dark ? "#020617" : "#e5e7eb",
              })}
            />
          </div>
        </div>

        {/* Humidity card */}
        <div
          style={{
            background: cardBg,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${border}`,
            boxShadow: dark
              ? "0 10px 30px rgba(0,0,0,0.5)"
              : "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ margin: 0, marginBottom: 8 }}>Humidity</h3>
          <div style={{ width: "100%", maxWidth: 160, margin: "0 auto" }}>
            <CircularProgressbar
              value={activeSensor.humidity}
              maxValue={100}
              text={`${activeSensor.humidity.toFixed(1)}%`}
              styles={buildStyles({
                pathColor: "#3b82f6",
                textColor: fg,
                trailColor: dark ? "#020617" : "#e5e7eb",
              })}
            />
          </div>
        </div>

        {/* Info card */}
        <div
          style={{
            background: cardBg,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${border}`,
            boxShadow: dark
              ? "0 10px 30px rgba(0,0,0,0.5)"
              : "0 10px 30px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0, marginBottom: 8 }}>Details</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "4px 0", color: subtle }}>Sensor ID</td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  {activeId}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: subtle }}>
                  Temperature
                </td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  {activeSensor.temperature.toFixed(1)} °C
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: subtle }}>Humidity</td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  {activeSensor.humidity.toFixed(1)} %
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: subtle }}>
                  Temp trend
                </td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  {trend.temp}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: subtle }}>
                  Hum trend
                </td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  {trend.hum}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 0", color: subtle }}>
                  Last updated
                </td>
                <td style={{ padding: "4px 0", textAlign: "right" }}>
                  {timeAgo(activeSensor.lastSeen)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart card */}
      <div
        style={{
          background: cardBg,
          borderRadius: 16,
          padding: 16,
          border: `1px solid ${border}`,
          boxShadow: dark
            ? "0 10px 30px rgba(0,0,0,0.5)"
            : "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>Temperature & Humidity History</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {TIME_WINDOWS.map((w) => (
              <button
                key={w.key}
                onClick={() => setTimeWindow(w.key)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border:
                    timeWindow === w.key
                      ? `1px solid #3b82f6`
                      : `1px solid ${border}`,
                  background:
                    timeWindow === w.key
                      ? (dark ? "#1d4ed8" : "#3b82f6")
                      : cardBg,
                  color:
                    timeWindow === w.key
                      ? "#ffffff"
                      : fg,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredHistory}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={dark ? "#1f2937" : "#e5e7eb"}
              />
              <XAxis dataKey="time" stroke={subtle} />
              <YAxis
                yAxisId="left"
                domain={[0, 50]}
                stroke={subtle}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                stroke={subtle}
              />
              <Tooltip
                contentStyle={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  color: fg,
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temperature"
                stroke="#f97373"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
