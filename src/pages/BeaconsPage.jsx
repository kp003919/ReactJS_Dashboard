import React, { useState, useEffect } from "react";

export default function BeaconsPage() {
  const [beacons, setBeacons] = useState([]);

  // Convert ESP32 millis() → "X seconds/minutes ago"
  const timeAgo = (lastSeen) => {
    if (lastSeen == null) return "—";

    // ESP32 uses millis() → compare with browser's relative clock
    const ageMs = performance.now() - lastSeen;
    const sec = Math.floor(ageMs / 1000);

    if (sec < 1) return "just now";
    if (sec < 60) return `${sec}s ago`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;

    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;

    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Re-render every second so "X seconds ago" stays fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setBeacons((prev) => [...prev]); // triggers re-render
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://192.168.0.21:1880/ws/beacons");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "rtls" && Array.isArray(data.beacons)) {
          setBeacons(data.beacons);
        }
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.close();
  }, []);

  // Optional: color‑code freshness
  const freshnessColor = (lastSeen) => {
    const ageMs = performance.now() - lastSeen;

    if (ageMs < 3000) return "#d4ffd4";      // fresh (0–3s)
    if (ageMs < 8000) return "#fff7d4";      // warm (3–8s)
    return "#ffd4d4";                        // stale (>8s)
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Live Beacon Data</h2>
      <p style={{ marginTop: -5, color: "#888" }}>
        Real‑time BLE beacon telemetry from ESP32 → Node‑RED → WebSocket.
      </p>

      <table
        border="1"
        cellPadding="6"
        style={{ marginTop: 20, borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th>ID</th>
            <th>RSSI</th>
            <th>Battery</th>
            <th>Type</th>
            <th>Last Seen</th>
          </tr>
        </thead>

        <tbody>
          {beacons.map((b, index) => (
            <tr
              key={`${b.beacon_id}-${index}`}
              style={{ background: freshnessColor(b.lastSeen) }}
            >
              <td>{b.beacon_id}</td>
              <td>{b.rssi}</td>
              <td>{b.battery}</td>
              <td>{b.type}</td>
              <td>{timeAgo(b.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {beacons.length === 0 && (
        <p style={{ color: "#888", marginTop: 10 }}>
          Waiting for beacon packets…
        </p>
      )}
    </div>
  );
}
