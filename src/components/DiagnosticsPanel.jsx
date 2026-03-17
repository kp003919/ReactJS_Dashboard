import React from "react";

export default function DiagnosticsPanel({ data, deviceName = "Device" }) {
  if (!data || data.length === 0) {
    return (
      <div className="diagnostics-panel">
        <h3>{deviceName} Diagnostics</h3>
        <p>No data available.</p>
      </div>
    );
  }

  const now = Date.now();
  const last = data[data.length - 1];
  const lastTimestamp = last.timestamp || 0;

  // Averages
  const avgTemp =
    data.reduce((sum, d) => sum + (d.temperature || 0), 0) / data.length;

  const avgHumidity =
    data.reduce((sum, d) => sum + (d.humidity || 0), 0) / data.length;

  // Readings in last hour
  const readingsLastHour = data.filter(
    (d) => now - (d.timestamp || 0) < 60 * 60 * 1000
  ).length;

  // Status logic
  let status = "OK";
  let statusColor = "green";

  const age = now - lastTimestamp;

  if (age > 60 * 60 * 1000) {
    status = "Offline";
    statusColor = "red";
  } else if (age > 5 * 60 * 1000) {
    status = "Warning";
    statusColor = "orange";
  }

  return (
    <div
      className="diagnostics-panel"
      style={{
        padding: "20px",
        borderRadius: "10px",
        background: "#f5f5f5",
        marginBottom: "20px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
      }}
    >
      <h3>{deviceName} Diagnostics</h3>

      <p>
        <strong>Last Received:</strong>{" "}
        {lastTimestamp
          ? new Date(lastTimestamp).toLocaleString()
          : "Unknown"}
      </p>

      <p>
        <strong>Average Temperature:</strong> {avgTemp.toFixed(2)} °C
      </p>

      <p>
        <strong>Average Humidity:</strong> {avgHumidity.toFixed(2)} %
      </p>

      <p>
        <strong>Readings Last Hour:</strong> {readingsLastHour}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: statusColor, fontWeight: "bold" }}>
          {status}
        </span>
      </p>
    </div>
  );
}
