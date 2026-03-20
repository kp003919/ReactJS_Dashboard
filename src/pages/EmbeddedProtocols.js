import React, { useEffect, useState } from "react";

export default function ControlPage() {
  const [i2c, setI2c] = useState(null);
  const [spi, setSpi] = useState(null);
  const [uart, setUart] = useState(null);
  const [modbus, setModbus] = useState(null);
  const [status, setStatus] = useState("Connecting…");
  const [dark, setDark] = useState(true);

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

  useEffect(() => {
    let socket;

    const connect = () => {
      socket = new WebSocket("ws://192.168.0.21:1880/ws/data");

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
