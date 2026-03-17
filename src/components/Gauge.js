import React from "react";
import "../css/DHTPage.css";

export default function Gauge({ value, max, label, icon }) {
  const angle = (value / max) * 180;

  return (
    <div className="gauge-wrapper">
      <div className="gauge">
        <div
          className="gauge-fill"
          style={{ transform: `rotate(${angle}deg)` }}
        />
        <div className="gauge-cover">
          <span className="gauge-icon">{icon}</span>
          <span className="gauge-value">{value}</span>
        </div>
      </div>
      <p className="gauge-label">{label}</p>
    </div>
  );
}
