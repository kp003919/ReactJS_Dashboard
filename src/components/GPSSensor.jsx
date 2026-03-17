import React from "react";

export default function GPSSensor({ latestData }) {
  if (!latestData) {
    return <p>Waiting for GPS data…</p>;
  }

  return (
    <div className="gps-sensor">
      <h3>Latest GPS Reading</h3>
      <p><strong>Latitude:</strong> {latestData.latitude}</p>
      <p><strong>Longitude:</strong> {latestData.longitude}</p>
      <p><strong>Altitude:</strong> {latestData.altitude} m</p>
      <p><strong>Speed:</strong> {latestData.speed} km/h</p>
    </div>
  );
}
