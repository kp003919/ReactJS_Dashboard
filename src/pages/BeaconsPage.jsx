import React, { useState, useEffect, useMemo } from "react";

export default function BeaconsPage() {
  const [beacons, setBeacons] = useState([]);
  const [dark, setDark] = useState(true);
  const [sortKey, setSortKey] = useState("lastSeen");

  const WS_URL = "ws://192.168.0.92:1880/ws/beacons";

  // Convert ESP32 millis() → "X seconds/minutes ago"
  const timeAgo = (lastSeen) => {
    if (!lastSeen) return "—";

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
      setBeacons((prev) => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "rtls" && Array.isArray(data.beacons)) {
          const now = performance.now();

          setBeacons((prev) => {
            const map = new Map(prev.map((b) => [b.id, b]));

            data.beacons.forEach((b) => {
              if (!b || typeof b.id === "undefined") return;

              if (map.has(b.id)) {
                const existing = map.get(b.id);
                existing.rssi = b.rssi ?? existing.rssi;
                existing.battery = b.battery ?? existing.battery;
                existing.type = b.type ?? existing.type;
              } else {
                map.set(b.id, {
                  id: b.id,
                  rssi: b.rssi ?? 0,
                  battery: b.battery ?? 0,
                  type: b.type ?? 0,
                  lastSeen: now,
                });
              }
            });

            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    return () => ws.close();
  }, []);

  const freshnessColor = (lastSeen) => {
    const ageMs = performance.now() - lastSeen;

    if (ageMs < 3000) return dark ? "#0f3d0f" : "#d4ffd4";
    if (ageMs < 8000) return dark ? "#4d3b00" : "#fff7d4";
    return dark ? "#4d0000" : "#ffd4d4";
  };

  const sortedBeacons = useMemo(() => {
    return [...beacons].sort((a, b) => {
      if (sortKey === "rssi") return b.rssi - a.rssi;
      if (sortKey === "battery") return b.battery - a.battery;
      return b.lastSeen - a.lastSeen;
    });
  }, [beacons, sortKey]);

  const bg = dark ? "#020617" : "#f5f5f5";
  const fg = dark ? "#e5e7eb" : "#111827";
  const cardBg = dark ? "#0b1120" : "#ffffff";
  const border = dark ? "#1f2937" : "#e5e7eb";
  const subtle = "#6b7280";

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
          <h2 style={{ margin: 0 }}>📡 Live Beacon Inspector</h2>
          <p style={{ marginTop: 4, color: subtle }}>
            Real‑time BLE packets from ESP32 → Node‑RED → WebSocket.
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

      {/* Sorting */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8, color: subtle }}>Sort by:</label>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: `1px solid ${border}`,
            background: cardBg,
            color: fg,
          }}
        >
          <option value="lastSeen">Freshness</option>
          <option value="rssi">RSSI</option>
          <option value="battery">Battery</option>
        </select>
      </div>

      {/* Beacon cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {sortedBeacons.map((b) => (
          <div
            key={b.id}
            style={{
              background: cardBg,
              borderRadius: 16,
              padding: 16,
              border: `1px solid ${border}`,
              boxShadow: dark
                ? "0 10px 30px rgba(0,0,0,0.5)"
                : "0 10px 30px rgba(0,0,0,0.08)",
              transition: "0.2s",
            }}
          >
            <div
              style={{
                background: freshnessColor(b.lastSeen),
                padding: 8,
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Beacon {b.id} — {timeAgo(b.lastSeen)}
            </div>

            {/* RSSI bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: subtle }}>RSSI</div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  background: dark ? "#1e293b" : "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(Math.abs(b.rssi), 100)}%`,
                    height: "100%",
                    background: b.rssi > -70 ? "#22c55e" : "#f97316",
                  }}
                />
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{b.rssi} dBm</div>
            </div>

            {/* Battery */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: subtle }}>Battery</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {b.battery}%
              </div>
            </div>

            {/* Type */}
            <div>
              <div style={{ fontSize: 12, color: subtle }}>Type</div>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  border: `1px solid ${border}`,
                }}
              >
                {b.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      {beacons.length === 0 && (
        <p style={{ color: subtle, marginTop: 20 }}>
          Waiting for beacon packets…
        </p>
      )}
    </div>
  );
}
