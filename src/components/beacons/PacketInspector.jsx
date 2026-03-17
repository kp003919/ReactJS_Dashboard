import React from "react";
import RssiSparkline from "./RssiSparkline";

export default function PacketInspector({ beacon }) {
  if (!beacon) {
    return (
      <div className="card">
        <h3>Packet Inspector</h3>
        <p>Select a beacon from the scanner to inspect its packet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Packet Inspector</h3>

      <p><strong>ID:</strong> {beacon.id}</p>
      <p><strong>RSSI:</strong> {beacon.rssi} dBm</p>
      <p><strong>Distance:</strong> {beacon.distance} m</p>

      <h4>Raw Packet</h4>
      <pre style={{ background: "#111", color: "#0f0", padding: "10px" }}>
        {beacon.rawPacket || "No packet data yet"}
      </pre>

      <h4>RSSI Trend</h4>
      <RssiSparkline data={beacon.rssiHistory || []} />
    </div>
  );
}
