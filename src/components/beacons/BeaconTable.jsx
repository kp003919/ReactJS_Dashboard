import React from "react";

export default function BeaconTable({ beacons, onSelect }) {
  return (
    <div style={{ maxHeight: "400px", overflowY: "auto" }}>
      <table style={{ width: "100%", marginTop: "10px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>RSSI</th>
            <th>Distance</th>
            <th>Last Seen</th>
          </tr>
        </thead>

        <tbody>
          {beacons.map((b) => (
            <tr key={b.id} onClick={() => onSelect(b)} style={{ cursor: "pointer" }}>
              <td>{b.id}</td>
              <td>{b.rssi} dBm</td>
              <td>{b.distance} m</td>
              <td>{b.lastSeen}s ago</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
