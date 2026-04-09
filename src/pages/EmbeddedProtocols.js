import React, { useEffect, useState } from "react";

/**
 * Embedded Protocols Control Page Component
 * This component provides a user interface for controlling and monitoring embedded protocols (I2C, SPI, UART, Modbus) connected to an ESP32 device. It allows users to send commands and view real-time data from each protocol.
  * The component establishes a WebSocket connection to receive live updates from the ESP32, displaying the latest data for each protocol along with timestamps. Users can select a protocol and send specific commands to the device, which are then forwarded to the backend server (Node‑RED) for processing. The UI is designed with a responsive grid layout and includes a dark mode toggle for improved readability. Error handling is implemented to provide feedback on command sending failures. This component serves as a central dashboard for managing and monitoring the embedded protocols of the IoT device, making it easier for users to interact with and understand the data being transmitted.  
  * 
 * @returns 
 */
export default function ControlPage() {
  const [i2c, setI2c] = useState(null);
  const [spi, setSpi] = useState(null);
  const [uart, setUart] = useState(null);
  const [modbus, setModbus] = useState(null);
  const [status, setStatus] = useState("Connecting…");
  const [dark, setDark] = useState(true);

  const [selectedProtocol, setSelectedProtocol] = useState("uart");
  const [command, setCommand] = useState("");
  const [sending, setSending] = useState(false);

  const [timestamps, setTimestamps] = useState({
    i2c: null,
    spi: null,
    uart: null,
    modbus: null,
  });

  const timeAgo = (ts) => {
    if (!ts) return "—";
    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 1) return "just now";
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    return `${hr}h ago`;
  };

  // ---------------------------
  // WebSocket Connection
  // ---------------------------
  useEffect(() => {
    let socket;

    const connect = () => {
      socket = new WebSocket("ws://192.168.0.92:1880/ws/data");

      socket.onopen = () => setStatus("Connected");

      socket.onclose = () => {
        setStatus("Disconnected — reconnecting…");
        setTimeout(connect, 2000);
      };

      socket.onerror = () => {
        setStatus("Error — reconnecting…");
        socket.close();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const now = Date.now();

          switch (msg.topic) {
            case "device/i2c":
              setI2c(msg.payload);
              setTimestamps((t) => ({ ...t, i2c: now }));
              break;

            case "device/spi":
              setSpi(msg.payload);
              setTimestamps((t) => ({ ...t, spi: now }));
              break;

            case "device/uart":
              setUart(msg.payload);
              setTimestamps((t) => ({ ...t, uart: now }));
              break;

            case "device/modbus":
              setModbus(msg.payload);
              setTimestamps((t) => ({ ...t, modbus: now }));
              break;

            default:
              console.warn("Unknown topic:", msg.topic);
          }
        } catch (err) {
          console.error("Invalid WebSocket message:", err);
        }
      };
    };

    connect();
    return () => socket && socket.close();
  }, []);

  // ---------------------------
  // Send Command to Node‑RED
  // ---------------------------
  async function sendCommand() {
    if (!command.trim()) return;

    setSending(true);

    try {
      await fetch("http://192.168.0.92:1880/sendcmd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocol: selectedProtocol,
          command: command.trim(),
        }),
      });
    } catch (err) {
      console.error("Failed to send command:", err);
    }

    setSending(false);
  }

  // ---------------------------
  // Theme Colors
  // ---------------------------
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
        transition: "0.2s",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );

  const DataRow = ({ label, value, ts }) => (
    <div style={{ marginBottom: 8 }}>
      <strong>{label}:</strong>{" "}
      <span style={{ color: subtle }}>{value ?? "—"}</span>
      {ts && (
        <span style={{ marginLeft: 8, fontSize: 12, color: subtle }}>
          ({timeAgo(ts)})
        </span>
      )}
    </div>
  );

  // ---------------------------
  // Render
  // ---------------------------
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
          <h2 style={{ margin: 0 }}>📡 Protocol Monitor</h2>
          <p style={{ marginTop: 4, color: subtle }}>
            Live I2C, SPI, UART, and Modbus data from ESP32 → Node‑RED → WebSocket.
          </p>
          <p style={{ marginTop: 4, fontSize: 13, color: subtle }}>
            Status:{" "}
            <span
              style={{
                color:
                  status.includes("Connected") ? "#22c55e" : "#f97316",
              }}
            >
              {status}
            </span>
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

      {/* Command Sender */}
      <div
        style={{
          background: cardBg,
          borderRadius: 16,
          padding: 20,
          border: `1px solid ${border}`,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>⚙️ Send Protocol Command</h3>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* Protocol Selector */}
          <select
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: cardBg,
              color: fg,
              border: `1px solid ${border}`,
            }}
          >
            <option value="uart">UART</option>
            <option value="spi">SPI</option>
            <option value="i2c">I2C</option>
          </select>

          {/* Command Input */}
          <input
            type="text"
            placeholder="Enter command (e.g., AT+STATUS)"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 8,
              background: cardBg,
              color: fg,
              border: `1px solid ${border}`,
            }}
          />

          {/* Send Button */}
          <button
            onClick={sendCommand}
            disabled={sending}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: sending ? "#6b7280" : "#2563eb",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>

      {/* Grid layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* I2C */}
        <Card title="I2C" icon="🔌">
          <DataRow label="Data" value={i2c} ts={timestamps.i2c} />
        </Card>

        {/* SPI */}
        <Card title="SPI" icon="🔄">
          <DataRow label="Data" value={spi} ts={timestamps.spi} />
        </Card>

        {/* UART */}
        <Card title="UART" icon="📨">
          <DataRow label="Data" value={uart} ts={timestamps.uart} />
        </Card>

        {/* Modbus */}
        <Card title="Modbus" icon="🧱">
          {modbus ? (
            <>
              <DataRow
                label="Register 0"
                value={modbus.register0}
                ts={timestamps.modbus}
              />
              <DataRow
                label="Register 1"
                value={modbus.register1}
                ts={timestamps.modbus}
              />
            </>
          ) : (
            <DataRow label="Modbus" value="No data yet" />
          )}
        </Card>
      </div>
    </div>
  );
}
