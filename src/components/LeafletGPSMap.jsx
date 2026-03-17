import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const LeafletGPSMap = ({ lat, lon, history = [], accuracy = 10, autoFollow = true }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const polylineRef = useRef(null);

  // Initialize map ONCE
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("leaflet-map", {
        zoomControl: true,
        attributionControl: true,
      }).setView([lat, lon], 16);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Marker
      markerRef.current = L.marker([lat, lon]).addTo(mapRef.current);

      // Accuracy circle
      accuracyCircleRef.current = L.circle([lat, lon], {
        radius: accuracy,
        color: "#00e5ff",
        fillColor: "#00e5ff",
        fillOpacity: 0.2,
      }).addTo(mapRef.current);

      // Polyline for history
      polylineRef.current = L.polyline([], {
        color: "#00e676",
        weight: 3,
      }).addTo(mapRef.current);
    }
  }, []);

  // Update marker + accuracy circle + polyline
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const newLatLng = [lat, lon];

    // Move marker
    markerRef.current.setLatLng(newLatLng);

    // Update accuracy circle
    accuracyCircleRef.current.setLatLng(newLatLng);
    accuracyCircleRef.current.setRadius(accuracy);

    // Update polyline
    if (history.length > 1) {
      const coords = history.map(p => [p.lat, p.lon]);
      polylineRef.current.setLatLngs(coords);
    }

    // Auto-follow
    if (autoFollow) {
      mapRef.current.setView(newLatLng);
    }
  }, [lat, lon, accuracy, history, autoFollow]);

  return (
    <div
      id="leaflet-map"
      style={{
        width: "100%",
        height: "450px",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    ></div>
  );
};

export default LeafletGPSMap;
