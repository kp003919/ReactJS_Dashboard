import React, { useState } from "react";

export default function ControlPanel() {
  const BASE_URL = "http://192.168.0.21:1880";

  const [lastCmd, setLastCmd] = useState(null);
  const [error, setError] = useState(null);
  const [dark, setDark] = useState(true);
  const [log, setLog] = useState([]);

  const sendCommand = async (path, label) => {
    try {
      setError(null);

      const res = await fetch(`${BASE_URL}${path}`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const entry = { label, ts: new Date().toLocaleTimeString() };
      setLastCmd(label);
      setLog((prev) => [entry, ...prev.slice(0, 19)]);
    } catch (err) {
      setError(`Failed: ${label}`);
    }
  };

  const bg = dark ? "#020617" : "#f5f5f5";
  const fg = dark ? "#e5e7eb" : "#111827";
  const cardBg = dark ? "#0b1120" : "#ffffff";
  const border = dark ? "#1f2937" : "#e5e7eb";
  const subtle = "#6b7280";

  const Card = ({ title, icon, children }) => (
    <div
      style={{
        background: cardBg,
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${border}`,
        boxShadow: dark
          ? "0 10px 30px rgba(0,0,0,0.5)"
          : "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );

  const CmdButton = ({ label, path, color }) => (
    <button
      onClick={() => sendCommand(path, label)}
      style={{
        padding: "10px 16px",
        marginRight: 10,
        marginTop: 10,
        borderRadius: 10,
        border: `1px solid ${border}`,
        background: color || (dark ? "#1e293b" : "#f3f4f6"),
        color: fg,
        cursor: "pointer",
        fontSize: 14,
        transition: "0.2s",
      }}
    >
      {label}
    </button>
  );

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
          marginBottom: 20,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>🛠️ Control Panel</h2>
          <p style={{ marginTop: 4, color: subtle }}>
            Manage actuators, system commands, and embedded protocol tests.
          </p>
        </div>

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

      {/* Grid layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* Fan */}
        <Card title="Fan Control" icon="🌀">
          <CmdButton label="Turn ON" path="/fan/on" color="#0ea5e9" />
          <CmdButton label="Turn OFF" path="/fan/off" color="#1e293b" />
        </Card>

        {/* Heater */}
        <Card title="Heater Control" icon="🔥">
          <CmdButton label="Turn ON" path="/heater/on" color="#f97316" />
          <CmdButton label="Turn OFF" path="/heater/off" color="#7f1d1d" />
        </Card>

        {/* System */}
        <Card title="System Commands" icon="⚙️">
          <CmdButton label="Reboot ESP32" path="/system/reboot" color="#facc15" />
          <CmdButton label="Reset WiFi" path="/system/resetwifi" color="#fbbf24" />
        </Card>

        {/* Protocols */}
        <Card title="Protocol Commands" icon="📡">
          <CmdButton label="Send SPI Command" path="/protocol/spi" />
          <CmdButton label="Send I2C Command" path="/protocol/i2c" />
          <CmdButton label="Send UART Command" path="/protocol/uart" />
        </Card>

        {/* Command Log */}
        <Card title="Command Log" icon="📝">
          {log.length === 0 ? (
            <p style={{ color: subtle }}>No commands sent yet…</p>
          ) : (
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {log.map((entry, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  <strong>{entry.label}</strong> — {entry.ts}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Feedback */}
      {lastCmd && (
        <p style={{ marginTop: 20, color: "#22c55e" }}>
          ✔ Command sent: <strong>{lastCmd}</strong>
        </p>
      )}

      {error && (
        <p style={{ marginTop: 10, color: "#f87171" }}>
          ✖ <strong>{error}</strong>
        </p>
      )}
    </div>
  );
}
