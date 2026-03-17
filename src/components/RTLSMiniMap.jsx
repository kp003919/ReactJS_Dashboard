import React from "react";
import "../css/RTLSMiniMap.css";
/**
 * // Simple RTLS Mini Map Component
 * // Displays beacon positions based on RSSI and distance
 * // Assumes beacons is an array of objects with { mac, rssi, distance, status }
 * // Example usage:  <RTLSMiniMap beacons={beaconData} />
 
 * @param {*} param0 
 * @returns  JSX.Element
 */

export default function RTLSMiniMap({ beacons }) {
  // Basic validation
  if (!Array.isArray(beacons) || beacons.length === 0) {
    return (
      <div className="rtls-minimap empty">
        No beacon positions available
      </div>
    );
  }

  // Calculate positions based on RSSI and distance
  // For simplicity, we will use distance to determine radial position
  // and RSSI to determine size/color intensity
  // Note: This is a simplified representation and may not reflect actual spatial positions 
  // without proper triangulation data.
  // Normalize distance into a 0–1 range for positioning
  const maxDistance = Math.max(...beacons.map(b => b.distance || 1));

  return (
    <div className="rtls-minimap">
      {beacons.map((b, i) => {
        const normalized = (b.distance || 0) / maxDistance;
         // Determine position
        // Simple radial placement (can be upgraded later)
        const angle = (i / beacons.length) * Math.PI * 2; // 
        const x = 50 + Math.cos(angle) * normalized * 40; // 40% radius
        const y = 50 + Math.sin(angle) * normalized * 40; // 40% radius
         // Return beacon dot
        return (
          <div
            key={b.mac}
            className="beacon-dot"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              backgroundColor: b.status === "online" ? "#4caf50" : "#f44336"
            }}
            title={`${b.mac}\nRSSI: ${b.rssi}\nDistance: ${b.distance?.toFixed(2)}m`}
          />
        );
      })}
    </div>
  );
}
