import React, { useState } from "react";

export default function ControlPanel() {
  const BASE_URL = "http://192.168.0.21:1880";

  const [lastCmd, setLastCmd] = useState(null);
  const [error, setError] = useState(null);

  const sendCommand = async (path, label) => {
    try {
      setError(null);
      const res = await fetch(`${BASE_URL}${path}`, { method: "POST" });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setLastCmd(label);
      console.log(`Command sent: ${label}`);
    } catch (err) {
      console.error("Command failed:", err);
      setError(`Failed: ${label}`);
    }
  };

  const Card = ({ title, children }) => (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        background: "#fff",
      }}
    >
      <h3>{title}</h3>
      {children}
    </div>
  );

  const CmdButton = ({ label, path }) => (
    <button
      style={{
        padding: "10px 20px",
        marginRight: "10px",
        marginTop: "10px",
        cursor: "pointer",
      }}
      onClick={() => sendCommand(path, label)}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Control Panel</h2>
      <p style={{ marginTop: -5, color: "#888" }}>
        Manage actuators and system commands.
      </p>

      {/* Fan Control */}
      <Card title="🌀 Fan Control">
        <CmdButton label="Turn ON" path="/fan/on" />
        <CmdButton label="Turn OFF" path="/fan/off" />
      </Card>

      {/* Heater Control */}
      <Card title="🔥 Heater Control">
        <CmdButton label="Turn ON" path="/heater/on" />
        <CmdButton label="Turn OFF" path="/heater/off" />
      </Card>

      {/* System Commands */}
      <Card title="⚙️ System Commands">
        <CmdButton label="Reboot ESP32" path="/system/reboot" />
        <CmdButton label="Reset WiFi" path="/system/resetwifi" />
      </Card>

      {/* Protocol Commands */}
      <Card title="📡 Protocol Commands">
        <CmdButton label="Send SPI Command" path="/protocol/spi" />
        <CmdButton label="Send I2C Command" path="/protocol/i2c" />
        <CmdButton label="Send UART Command" path="/protocol/uart" />
      </Card>

      {/* Feedback */}
      {lastCmd && (
        <p style={{ marginTop: 20, color: "#555" }}>
          Last command sent: <strong>{lastCmd}</strong>
        </p>
      )}

      {error && (
        <p style={{ marginTop: 10, color: "red" }}>
          <strong>{error}</strong>
        </p>
      )}
    </div>
  );
}
