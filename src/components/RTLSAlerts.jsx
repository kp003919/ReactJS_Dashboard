import React from "react";
import "../css/RTLSAlerts.css";

export default function RTLSAlerts({ beacons }) {
  if (!Array.isArray(beacons) || beacons.length === 0) {
    return null;
  }

  const alerts = [];

  beacons.forEach((b) => {
    // Offline alert
    if (b.status === "offline") {
      alerts.push({
        type: "offline",
        message: `Device ${b.mac} is offline`,
      });
    }

    // Weak signal alert
    if (typeof b.rssi === "number" && b.rssi < -80) {
      alerts.push({
        type: "weak",
        message: `Weak signal from ${b.mac} (RSSI ${b.rssi} dBm)`,
      });
    }

    // Stale alert (not seen for > 10 seconds)
    if (b.lastSeen) {
      const last = new Date(b.lastSeen).getTime();
      const now = Date.now();
      const diff = (now - last) / 1000;

      if (diff > 10) {
        alerts.push({
          type: "stale",
          message: `Device ${b.mac} has stale data (${Math.round(diff)}s old)`,
        });
      }
    }
  });

  if (alerts.length === 0) {
    return (
      <div className="alerts-panel ok">
        <p>No alerts — all devices healthy</p>
      </div>
    );
  }

  return (
    <div className="alerts-panel">
      <h3>Alerts</h3>
      {alerts.map((a, i) => (
        <div key={i} className={`alert-item ${a.type}`}>
          {a.message}
        </div>
      ))}
    </div>
  );
}
