/**
 * // BeaconHistoryDrawer.jsx
 *
 * A React component that displays detailed information about a selected beacon,
 * including its RSSI history and raw JSON data, in a drawer overlay. 
 * The drawer can be closed by clicking outside of it or on the close button. 
 * Example usage: <BeaconHistoryDrawer beacon={selectedBeacon} history={rssiHistory} onClose={closeDrawer} />
 *
 * @param {*} param0 
 * @returns JSX.Element 
 * @version 1.0.0
 * @author Muhsin Atto 
 * @license MIT
 */  

import React from "react";
import "../css/BeaconHistoryDrawer.css";

export default function BeaconHistoryDrawer({ beacon, history, onClose }) {
  if (!beacon) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>

        <h2>Beacon Details</h2>

        <div className="drawer-section">
          <strong>MAC:</strong> {beacon.mac}
        </div>

        <div className="drawer-section">
          <strong>Status:</strong> {beacon.status}
        </div>

        <div className="drawer-section">
          <strong>RSSI:</strong> {beacon.rssi} dBm
        </div>

        <div className="drawer-section">
          <strong>Distance:</strong> {beacon.distance?.toFixed(2)} m
        </div>

        <div className="drawer-section">
          <strong>Last Seen:</strong> {beacon.lastSeen}
        </div>

        <h3>RSSI History</h3>
        <ul className="drawer-history">
          {history?.map((h, i) => (
            <li key={i}>
              {h.time} → {h[beacon.mac]} dBm
            </li>
          ))}
        </ul>

        <h3>Raw Data</h3>
        <pre className="drawer-json">
            {JSON.stringify(beacon, null, 2)}
        </pre>
      </div>
    </div>
  );
}
