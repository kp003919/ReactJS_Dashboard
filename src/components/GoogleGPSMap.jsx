import React, { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  LoadScriptNext,
  Marker,
  TrafficLayer,
  DirectionsRenderer,
  Polyline,
  Circle,
  StreetViewPanorama
} from "@react-google-maps/api";

/* ---------------------------------------------
   DARK MODE MAP STYLE
---------------------------------------------- */
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e0e0e0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2c" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0b0b0" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1a25" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#242424" }]
  }
];

/* ---------------------------------------------
   MAIN COMPONENT
---------------------------------------------- */
export default function GoogleGPSMap({
  devices = [],
  autoFollow = true
}) {
  const [mapType, setMapType] = useState("dark");
  const [showTraffic, setShowTraffic] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [directions, setDirections] = useState(null);
  const [myLocation, setMyLocation] = useState(null);

  const mapRef = useRef(null);

  const containerStyle = {
    width: "100%",
    height: "450px",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative"
  };

  /* ---------------------------------------------
     GET USER'S LIVE LOCATION
  ---------------------------------------------- */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  /* ---------------------------------------------
     AUTO-FOLLOW FIRST DEVICE
  ---------------------------------------------- */
  useEffect(() => {
    if (autoFollow && devices.length > 0 && mapRef.current) {
      const d = devices[0];
      mapRef.current.panTo({ lat: d.lat, lng: d.lon });
    }
  }, [devices, autoFollow]);

  /* ---------------------------------------------
     DEBUG LOGS
  ---------------------------------------------- */
  console.log("API KEY:", process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
  console.log("GOOGLE OBJECT:", window.google);

  /* ---------------------------------------------
     DIRECTIONS EXAMPLE
  ---------------------------------------------- */
  const requestDirections = () => {
    if (devices.length === 0 || !window.google) return;

    const d = devices[0];
    const service = new window.google.maps.DirectionsService();

    service.route(
      {
        origin: { lat: d.lat, lng: d.lon },
        destination: { lat: d.lat + 0.001, lng: d.lon + 0.001 },
        travelMode: "DRIVING"
      },
      (result, status) => {
        if (status === "OK") setDirections(result);
      }
    );
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Controls */}
      <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
        <button onClick={() => setMapType(t => t === "dark" ? "roadmap" : "dark")}>
          Toggle Dark Mode
        </button>

        <button onClick={() => setShowTraffic(t => !t)}>
          {showTraffic ? "Hide Traffic" : "Show Traffic"}
        </button>

        <button onClick={() => setShowStreetView(v => !v)}>
          {showStreetView ? "Hide Street View" : "Show Street View"}
        </button>

        <button onClick={requestDirections}>
          Show Directions
        </button>
      </div>

      {/* Main Map */}
      <LoadScriptNext
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        onError={(e) => console.error("GOOGLE MAPS FAILED TO LOAD:", e)}
        onLoad={() => console.log("GOOGLE MAPS SCRIPT LOADED")}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={
            devices.length > 0
              ? { lat: devices[0].lat, lng: devices[0].lon }
              : { lat: 53.3811, lng: -1.4701 } // ⭐ Sheffield fallback instead of ocean
          }
          zoom={17}
          mapTypeId={mapType === "dark" ? "roadmap" : mapType}
          options={{
            styles: mapType === "dark" ? darkMapStyle : null
          }}
          onLoad={(map) => (mapRef.current = map)}
        >
          {/* Markers, accuracy circles, history, etc. */}
          {devices.map(device => (
            <React.Fragment key={device.id}>
              <Marker
                position={{ lat: device.lat, lng: device.lon }}
                icon={{
                  url: `https://maps.gstatic.com/mapfiles/ms2/micons/${device.color || "red"}-dot.png`,
                  scaledSize: window.google
                    ? new window.google.maps.Size(40, 40)
                    : undefined
                }}
              />

              <Circle
                center={{ lat: device.lat, lng: device.lon }}
                radius={device.accuracy || 10}
                options={{
                  fillColor: device.color || "#00e5ff",
                  fillOpacity: 0.2,
                  strokeColor: device.color || "#00e5ff",
                  strokeOpacity: 0.8,
                  strokeWeight: 2
                }}
              />

              {device.history && device.history.length > 1 && (
                <Polyline
                  path={device.history.map(p => ({ lat: p.lat, lng: p.lon }))}
                  options={{
                    strokeColor: device.color || "#00e676",
                    strokeOpacity: 1,
                    strokeWeight: 3
                  }}
                />
              )}
            </React.Fragment>
          ))}

          {myLocation && (
            <Marker
              position={myLocation}
              icon={{
                url: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png"
              }}
            />
          )}

          {showTraffic && <TrafficLayer />}
          {directions && <DirectionsRenderer directions={directions} />}

          {showStreetView && devices.length > 0 && (
            <StreetViewPanorama
              position={{ lat: devices[0].lat, lng: devices[0].lon }}
              visible={true}
              options={{ pov: { heading: 100, pitch: 0 } }}
            />
          )}
        </GoogleMap>
      </LoadScriptNext>
    </div>
  );
} 