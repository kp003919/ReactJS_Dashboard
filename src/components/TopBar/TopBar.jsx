import React from "react";
import "./TopBar.css";

export default function TopBar({ stats, onEnvChange, onTimeRangeChange }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo">Curve</div>
        <div className="title">RTLS Dashboard</div>

        <select className="env-select" onChange={onEnvChange}>
          <option>Production</option>
          <option>Staging</option>
          <option>Testing</option>
        </select>

        <select className="time-select" onChange={onTimeRangeChange}>
          <option>Live</option>
          <option>Last 10 min</option>
          <option>Last 1 hour</option>
        </select>
      </div>

      <div className="topbar-stats">
        <div className="stat">Tags Online: {stats.tagsOnline}</div>
        <div className="stat">Anchors Online: {stats.anchorsOnline}</div>
        <div className="stat">Latency: {stats.latency} ms</div>
      </div>

      <div className="topbar-user">
        <div className="user-icon">⚙</div>
      </div>
    </div>
  );
}
