import React, { useState, useCallback } from "react";

/**
 * Control Panel Component  
 * This React component serves as a control panel for managing actuators, system commands,
 *  and embedded protocol tests for an IoT device. It provides a user interface with buttons
 *  to send commands to the device, such as turning on/off a fan or heater, rebooting the 
 * system, resetting WiFi, and sending protocol-specific commands (SPI, I2C, UART). 
 * The component also includes a command log to display recently sent commands and their 
 * timestamps. A dark mode toggle is provided for user preference. The component communicates
 *  with the backend server (presumably running on the ESP32) via HTTP POST requests to specific endpoints corresponding 
 * to each command. Error handling is implemented to provide feedback on command failures. The UI is designed with a responsive grid layout and styled with inline styles for simplicity. 
 *  
 * @returns {JSX.Element} The rendered control panel component.
 * 
 * Note: The BASE_URL should be updated to match the actual IP address and port of the backend server handling the commands. The component assumes that the backend server has endpoints set up to handle the specified paths for each command. Additionally, this component is designed to be part of a larger React application and may require additional context or styling to fit seamlessly into the overall UI.    
 * 
 */
export default function ControlPanel() {
  // Base URL for the backend server (ESP32) - update this to match your actual server address and port   
  // For example, if your ESP32 is running a server on the local network at IP address      
  const BASE_URL = "http://192.168.0.92:1880";
  
  // State variables for tracking the last command sent, any errors, dark mode toggle, and command log  
  // lastCmd: Stores the label of the last command sent to provide user feedback. It is updated whenever a command is successfully sent.  
  // error: Stores any error messages that occur during the command sending process. It is updated if an error occurs while making the HTTP request to the backend server.  
  // dark: A boolean state that toggles between dark mode and light mode for the UI. It is updated when the user clicks the "Light mode"/"Dark mode" button.  
  // log: An array that keeps a history of recently sent commands along with their timestamps. It is updated each time a command is successfully sent, with new entries added to the beginning of the array and old entries removed to maintain a maximum of 20 log entries.    

  const [lastCmd, setLastCmd] = useState(null);
  const [error, setError] = useState(null);
  const [dark, setDark] = useState(true);
  const [log, setLog] = useState([]);

  // Function to send commands to the backend server (ESP32) via HTTP POST requests. It takes a path and label as arguments, constructs the full URL, and makes the request. If the request is successful, it updates the last command and command log. If an error occurs, it sets the error state to provide feedback to the user. The function is wrapped in useCallback to prevent unnecessary re-renders when passed as a prop to child components.  
  
  const sendCommand = useCallback(async (path, label) => {
    try {
      setError(null);

      const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const entry = { label, ts: new Date().toLocaleTimeString() };
      setLastCmd(label);
      setLog((prev) => [entry, ...prev.slice(0, 19)]);
    } catch (err) {
      setError(`Failed: ${label}`);
    }
  }, []);

  const theme = {
    bg: dark ? "#020617" : "#f5f5f5",
    fg: dark ? "#e5e7eb" : "#111827",
    cardBg: dark ? "#0b1120" : "#ffffff",
    border: dark ? "#1f2937" : "#e5e7eb",
    subtle: "#6b7280",
  };

  const Card = ({ title, icon, children }) => (
    <div
      style={{
        background: theme.cardBg,
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${theme.border}`,
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
        border: `1px solid ${theme.border}`,
        background: color || (dark ? "#1e293b" : "#f3f4f6"),
        color: theme.fg,
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
        background: theme.bg,
        minHeight: "100vh",
        color: theme.fg,
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
          <p style={{ marginTop: 4, color: theme.subtle }}>
            Manage actuators, system commands, and embedded protocol tests.
          </p>
        </div>

        <button
          onClick={() => setDark((d) => !d)}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${theme.border}`,
            background: theme.cardBg,
            color: theme.fg,
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
            <p style={{ color: theme.subtle }}>No commands sent yet…</p>
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
