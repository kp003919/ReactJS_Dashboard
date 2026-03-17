import React, { useEffect, useState } from "react";

export default function ControlPage() {
  const [i2c, setI2c] = useState(null);
  const [spi, setSpi] = useState(null);
  const [uart, setUart] = useState(null);
  const [modbus, setModbus] = useState(null);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    let socket;

    const connectWebSocket = () => {
      socket = new WebSocket("ws://192.168.0.21:1880/ws/data");

      socket.onopen = () => {
        setStatus("Connected");
      };

      socket.onclose = () => {
        setStatus("Disconnected — reconnecting...");
        setTimeout(connectWebSocket, 2000);
      };

      socket.onerror = () => {
        setStatus("Error — reconnecting...");
        socket.close();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.topic) {
            case "device/i2c":
              setI2c(msg.payload);
              break;
            case "device/spi":
              setSpi(msg.payload);
              break;
            case "device/uart":
              setUart(msg.payload);
              break;
            case "device/modbus":
              setModbus(msg.payload);
              break;
            default:
              console.warn("Unknown topic:", msg.topic);
          }
        } catch (err) {
          console.error("Invalid WebSocket message:", err);
        }
      };
    };

    connectWebSocket();
    return () => socket && socket.close();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Control Page</h2>
      <p style={{ color: "#888" }}>WebSocket Status: {status}</p>

      <div style={{ marginTop: "20px" }}>
        <h3>Protocol Data</h3>

        <p><strong>I2C Data:</strong> {i2c ?? "No data yet"}</p>
        <p><strong>SPI Data:</strong> {spi ?? "No data yet"}</p>
        <p><strong>UART Data:</strong> {uart ?? "No data yet"}</p>

        {modbus && (
          <>
            <p><strong>Modbus Register 0:</strong> {modbus.register0}</p>
            <p><strong>Modbus Register 1:</strong> {modbus.register1}</p>
          </>
        )}
        {!modbus && <p><strong>Modbus:</strong> No data yet</p>}
      </div>
    </div>
  );
}
