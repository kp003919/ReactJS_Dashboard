// src/components/RTLSFloorMap.jsx
import React, { useMemo } from "react";
import "../css/RTLSFloorMap.css";

function hashAngle(mac) {
  let h = 0;
  for (let i = 0; i < mac.length; i++) h = (h * 31 + mac.charCodeAt(i)) >>> 0;
  return (h % 360) * (Math.PI / 180);
}

export default function RTLSFloorMap({ beacons, anchors, zones, onBeaconClick }) {
  const width = 600;
  const height = 600;

  const beaconObjects = useMemo(() => {
    return beacons.map((b) => {
      const angle = hashAngle(b.mac);
      const dist = b.distance ?? 0;

      // Convert distance to map scale (your map is 100x100)
      const scale = 2; // adjust if needed
      const r = dist * scale;

      const x = 300 + r * Math.cos(angle);
      const y = 300 + r * Math.sin(angle);

      return {
        ...b,
        x,
        y,
        angle
      };
    });
  }, [beacons]);

  return (
    <svg width={width} height={height} className="rtls-floor-map">

      {/* Zones */}
      {zones.map((z) => (
        <rect
          key={z.id}
          x={z.xMin * 6}
          y={z.yMin * 6}
          width={(z.xMax - z.xMin) * 6}
          height={(z.yMax - z.yMin) * 6}
          fill="rgba(0, 150, 255, 0.08)"
          stroke="rgba(0, 150, 255, 0.3)"
        />
      ))}

      {/* Anchors */}
      {anchors.map((a) => (
        <g key={a.id}>
          <circle cx={a.x * 6} cy={a.y * 6} r={6} fill="black" />
          <text x={a.x * 6 + 10} y={a.y * 6 - 5} fontSize="12">
            {a.id}
          </text>
        </g>
      ))}

      {/* Beacons + trails */}
      {beaconObjects.map((b) => (
        <g key={b.mac} onClick={() => onBeaconClick(b)} style={{ cursor: "pointer" }}>
          {/* Trail */}
          {b.history && b.history.length > 1 && (
            <polyline
              points={b.history
                .map((h) => {
                  const angle = hashAngle(b.mac);
                  const r = (h.distance ?? 0) * 2;
                  const x = 300 + r * Math.cos(angle);
                  const y = 300 + r * Math.sin(angle);
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke="orange"
              strokeWidth="2"
              opacity="0.6"
            />
          )}

          {/* Beacon dot */}
          <circle cx={b.x} cy={b.y} r={8} fill="red" />
          <text x={b.x + 10} y={b.y - 5} fontSize="12" fill="red">
            {b.mac}
          </text>
        </g>
      ))}
    </svg>
  );
}
