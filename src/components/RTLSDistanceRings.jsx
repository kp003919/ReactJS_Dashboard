import React from "react";
import "../css/RTLSDistanceRings.css";

export default function RTLSDistanceRings({ beacons }) {
  if (!Array.isArray(beacons) || beacons.length === 0) {
    return (
      <div className="distance-rings empty">
        No distance data available
      </div>
    );
  }

  // Find max distance to normalize ring sizes
  const maxDistance = Math.max(
    ...beacons.map((b) => (typeof b.distance === "number" ? b.distance : 0)),
    1
  );

  return (
    <div className="distance-rings">
      <h3>Distance Rings</h3>

      <div className="rings-container">
        {beacons.map((b) => {
          const dist = typeof b.distance === "number" ? b.distance : 0;

          // Normalize 0–1
          const scale = dist / maxDistance;

          // Ring size (min 40px, max 200px)
          const size = 40 + scale * 160;

          // Color based on RSSI
          const color =
            b.rssi > -60 ? "#4caf50" : b.rssi > -75 ? "#ff9800" : "#f44336";

          return (
            <div key={b.mac} className="ring-item">
              <div
                className="ring"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderColor: color,
                }}
              ></div>

              <p className="ring-label">
                {b.mac}
                <br />
                {dist ? `${dist.toFixed(2)} m` : "0.00 m"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
