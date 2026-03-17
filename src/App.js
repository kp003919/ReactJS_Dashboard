import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./Navbar";
import DHTPage from "./pages/DHTPage";   // DHT page 
import GPSPage from "./pages/GPSPage";   // GPS page 
import RTLSPage from "./pages/RTLSPage";   // ⭐ Your new unified RTLS dashboard
import BeaconsPage from "./pages/BeaconsPage"; // Beacon page for BLE packet inspection 
import ControlPanel from "./pages/ControlPanel";
import EmbeddedProtocols from "./pages/EmbeddedProtocols";



export default function App() {
  const [dht, setDht] = useState(null);
  const [gps, setGps] = useState(null);

  const API = "https://0oblcr2phd.execute-api.eu-west-2.amazonaws.com/prod";

  useEffect(() => {
    const fetchAll = () => {
      fetch(`${API}/data`)
        .then(res => res.json())
        .then(json => setDht(json.dht))
        .catch(err => console.error("DHT ERROR:", err));

      fetch(`${API}/gps`)
        .then(res => res.json())
        .then(json => setGps(json.gps))
        .catch(err => console.error("GPS ERROR:", err));
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={dht ? <DHTPage latestData={dht} /> : <p>Loading...</p>}
        />

        <Route
          path="/gps"
          element={gps ? <GPSPage latestData={gps} /> : <p>Loading...</p>}
        />

        {/* ⭐ Unified RTLS Dashboard (Live MQTT + Map + Alerts + Chart) */}
        <Route path="/rtls" element={<RTLSPage />} />

        {/* Beacn page for BLE packet inspection */}
        <Route path="/beacons" element={<BeaconsPage />} />

        <Route path="/control-panel" element={<ControlPanel />} />
       {/* A new page to learn embedded protocols */}
        <Route path="/embedded-protocols" element={<EmbeddedProtocols />} />



      </Routes>
    </BrowserRouter>
  );
}
