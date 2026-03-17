import React from "react";
import "../css/SmartAlertsPanel.css";

const SmartAlertsPanel = ({ latest, previous }) => {
  if (!latest || !previous) return null;

  const alerts = [];

  // -----------------------------
  // 1. Trend Detection
  // -----------------------------
  const tempDiff = latest.temperature - previous.temperature;

  if (tempDiff > 2) alerts.push("Temperature rising unusually fast");
  if (tempDiff < -2) alerts.push("Temperature dropping unusually fast");

  // -----------------------------
  // 2. Threshold Alerts
  // -----------------------------
  if (latest.temperature > 30) alerts.push("High temperature detected");
  if (latest.temperature < 10) alerts.push("Low temperature detected");

  if (latest.humidity > 70) alerts.push("High humidity detected");
  if (latest.humidity < 20) alerts.push("Low humidity detected");

  // -----------------------------
  // 3. Device Offline Detection
  // -----------------------------
  const lastUpdate = latest.timestamp;
  if (Date.now() - lastUpdate > 10000) {
    alerts.push("Device may be offline (no new data)");
  }

  // -----------------------------
  // 4. Sensor Stuck Detection
  // -----------------------------
  if (latest.temperature === previous.temperature) {
    alerts.push("Temperature sensor may be stuck");
  }

  if (latest.humidity === previous.humidity) {
    alerts.push("Humidity sensor may be stuck");
  }

  // -----------------------------
  // 5. Extreme Value Detection
  // -----------------------------
  if (latest.temperature < -20 || latest.temperature > 80) {
    alerts.push("Temperature reading out of realistic range");
  }

  // -----------------------------
  // 6. GPS Alerts (if GPS fields exist)
  // -----------------------------
  if ("latitude" in latest && "longitude" in latest) {
    if (!latest.latitude || !latest.longitude) {
      alerts.push("GPS signal lost");
    }
  }

  if (latest.speed !== undefined && latest.speed > 50) {
    alerts.push("Device moving too fast");
  }

  // -----------------------------
  // 7. All Clear
  // -----------------------------
  if (alerts.length === 0) {
    return <div className="alert-panel ok">All conditions normal</div>;
  }

  // -----------------------------
  // 8. Render Alerts
  // -----------------------------
  return (
    <div className="alert-panel warning">
      <h3>Smart Alerts</h3>
      <ul>
        {alerts.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </div>
  );
};

export default SmartAlertsPanel;
