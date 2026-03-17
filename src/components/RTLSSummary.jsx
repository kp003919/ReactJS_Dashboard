import React from "react";
import "../css/RTLSSummary.css";

export default function RTLSSummary({ beacons }) {
  if (!Array.isArray(beacons) || beacons.length === 0) {
    return (
      <div className="rtls-summary">
        <div className="summary-card">Total: 0</div>
        <div className="summary-card">Online: 0</div>
        <div className="summary-card">Offline: 0</div>
        <div className="summary-card">Avg RSSI: N/A</div>
        <div className="summary-card">Closest: N/A</div>
        <div className="summary-card">Farthest: N/A</div>
      </div>
    );
  }

  const total = beacons.length;
  const online = beacons.filter(b => b.status === "online").length;
  const offline = total - online;

  const avgRSSI = Math.round(
    beacons.reduce((sum, b) => sum + (b.rssi ?? 0), 0) / total
  );

  // Filter out beacons with missing distance
  const validDistances = beacons.filter(b => typeof b.distance === "number");

  const closest = validDistances.length
    ? validDistances.reduce((a, b) => (a.distance < b.distance ? a : b))
    : null;

  const farthest = validDistances.length
    ? validDistances.reduce((a, b) => (a.distance > b.distance ? a : b))
    : null;

  return (
    <div className="rtls-summary">
      <div className="summary-card">Total: {total}</div>
      <div className="summary-card online">Online: {online}</div>
      <div className="summary-card offline">Offline: {offline}</div>
      <div className="summary-card">Avg RSSI: {avgRSSI} dBm</div>
      <div className="summary-card">
        Closest: {closest ? `${closest.distance.toFixed(2)} m` : "N/A"}
      </div>
      <div className="summary-card">
        Farthest: {farthest ? `${farthest.distance.toFixed(2)} m` : "N/A"}
      </div>
    </div>
  );
}
