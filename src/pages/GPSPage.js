import React, { useState, useEffect, useMemo } from "react";
import LeafletGPSMap from "../components/LeafletGPSMap";
import GoogleGPSMap from "../components/GoogleGPSMap";
import SpeedTrend from "../components/SpeedTrend";
import "../css/GPSPage.css";

// Bearing calculation
function calculateBearing(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

  const toRad = deg => (deg * Math.PI) / 180;
  const dLon = toRad(lon2 - lon1);

  lat1 = toRad(lat1);
  lat2 = toRad(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let brng = Math.atan2(y, x);
  brng = (brng * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Distance between two GPS points (Haversine)
function haversine(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;

  const R = 6371e3;
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GPS Page Component
 * This component displays real-time GPS data and tracking information for the IoT device.    
 * It receives the latest GPS data as a prop (latestData) and maintains a history of GPS points to display on the map and calculate trends. The component calculates additional information such as bearing and total distance traveled based on the GPS history. It also provides options to switch between different map providers (Leaflet and Google Maps) and toggle auto-follow mode for the map view. The UI includes a card displaying the current GPS information, a speed trend chart, and an interactive map showing the device's location and movement history. The component is designed to be responsive and visually appealing, making it easy for users to monitor their device's GPS data effectively. 
 *  
 * @param {*} param0  is a last updated data to be displayed on the GPS page. It is expected to be an object containing GPS information such as latitude, longitude, speed, accuracy, and altitude. This data is typically received from a WebSocket connection or an API call that provides real-time updates from the GPS module connected to the IoT device. The component uses this latestData prop to update the display of GPS information and to maintain a history of GPS points for tracking and visualization purposes. The component also calculates additional metrics such as bearing and total distance traveled based on the history of GPS data. 
 * @returns 
 */ 
 

 
export default function GPSPage({ latestData }) {
  const [history, setHistory] = useState([]);
  const [mapMode, setMapMode] = useState("leaflet");
  const [autoFollow, setAutoFollow] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Update history
  useEffect(() => {
    if (!latestData) return;
    setHistory(prev => [...prev.slice(-99), latestData]);
    setLastUpdate(Date.now());
  }, [latestData]);

  // Extract values safely
  const lat = latestData?.lat ?? null;
  const lon = latestData?.lon ?? null;
  const speed = latestData?.speed ?? null;
  const accuracy = latestData?.accuracy ?? null;
  const alt = latestData?.alt ?? null;

  // Bearing calculation
  const bearing = useMemo(() => {
    if (!latestData || history.length < 2) return null;
    const prev = history[history.length - 2];
    return calculateBearing(prev.lat, prev.lon, lat, lon);
  }, [history, latestData, lat, lon]);

  // Total distance
  const totalDistance = useMemo(() => {
    if (history.length < 2) return 0;

    let sum = 0;
    for (let i = 1; i < history.length; i++) {
      const a = history[i - 1];
      const b = history[i];
      sum += haversine(a.lat, a.lon, b.lat, b.lon);
    }
    return sum;
  }, [history]);

  const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);
  const isStale = secondsAgo > 10;

  if (!latestData) return <p>Loading GPS data…</p>;

  return (
    <div className="gps-page">
      <h2>GPS Tracking</h2>

      <div className="gps-info-card">
        <h3>Device Info</h3>

        <p>
          <strong>Status:</strong>
          <span style={{ color: isStale ? "red" : "green" }}>
            {isStale ? "Offline / Stale" : "Online"}
          </span>
        </p>

        <p><strong>Latitude:</strong> {lat != null ? lat.toFixed(6) : "N/A"}</p>
        <p><strong>Longitude:</strong> {lon != null ? lon.toFixed(6) : "N/A"}</p>
        <p><strong>Altitude:</strong> {alt != null ? alt.toFixed(1) : "N/A"} m</p>
        <p><strong>Speed:</strong> {speed != null ? speed.toFixed(1) : "N/A"} km/h</p>
        <p><strong>Bearing:</strong> {bearing != null ? `${bearing.toFixed(0)}°` : "N/A"}</p>
        <p><strong>Accuracy:</strong> {accuracy != null ? `±${accuracy} m` : "N/A"}</p>
        <p><strong>Total Distance:</strong> {(totalDistance / 1000).toFixed(2)} km</p>
        <p><strong>Last Update:</strong> {secondsAgo}s ago</p>

        <button onClick={() => setMapMode(m => (m === "leaflet" ? "google" : "leaflet"))}>
          Switch to {mapMode === "leaflet" ? "Google Maps" : "Leaflet"}
        </button>

        <button onClick={() => setAutoFollow(a => !a)}>
          {autoFollow ? "Disable Auto-Follow" : "Enable Auto-Follow"}
        </button>
      </div>

      <div className="gps-speed-trend">
        <SpeedTrend history={history} />
      </div>

      <div className="gps-map-container">
        {mapMode === "leaflet" ? (
          <LeafletGPSMap
            lat={lat}
            lon={lon}
            history={history}
            accuracy={accuracy}
            autoFollow={autoFollow}
          />
        ) : (
          <GoogleGPSMap lat={lat} lon={lon} />
        )}
      </div>
    </div>
  );
}
