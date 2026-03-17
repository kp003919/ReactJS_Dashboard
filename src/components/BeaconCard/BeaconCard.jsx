import React from "react";
import "./BeaconCard.css";

export default function BeaconCard({ beacon }) {
  // Prevent crash if beacon is undefined or null
  if (!beacon || typeof beacon !== "object") {
    return (
      <div className="beacon-card empty">
        No beacon data
      </div>
    );
  }

  const {
    mac = "Unknown",
    rssi = 0,
    distance = 0,
    lastSeen = 0,
    status = "offline"
  } = beacon;

  const isOnline = status.toLowerCase() === "online";

  const formatLastSeen = (timestamp) => {
    const now = Date.now();
    const seenTime = timestamp * 1000;
    const diffMs = now - seenTime;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;

    return new Date(seenTime).toLocaleString();
  };

  const getSignalBars = (rssi) => {
    if (rssi >= -60) return 4;
    if (rssi >= -70) return 3;
    if (rssi >= -80) return 2;
    if (rssi >= -90) return 1;
    return 0;
  };

  const bars = getSignalBars(rssi);

  const copyMAC = () => {
    navigator.clipboard.writeText(mac);
  };

  return (
    <div className={`beacon-card ${isOnline ? "online" : "offline"}`}>
      <div className="status-badge">
        <i className={`fa ${isOnline ? "fa-check-circle" : "fa-times-circle"}`} />
        {isOnline ? "Online" : "Offline"}
      </div>

      <div className="mac-address">
        MAC: {mac}
        <button onClick={copyMAC} title="Copy MAC">📋</button>
      </div>

      <div className="signal">
        RSSI: {rssi} dBm
        <div className="bars">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`bar ${i < bars ? "active" : ""}`} />
          ))}
        </div>
      </div>

      <div className="distance">Distance: {distance.toFixed(2)} m</div>
      <div className="last-seen">Last Seen: {formatLastSeen(lastSeen)}</div>
    </div>
  );
}
