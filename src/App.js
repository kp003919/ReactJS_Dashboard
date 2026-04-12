import React, { createContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./Navbar";
import DHTPage from "./pages/DHTPage";
import GPSPage from "./pages/GPSPage";
import RTLSPage from "./pages/RTLSPage";
import BeaconsPage from "./pages/BeaconsPage";
import ControlPanel from "./pages/ControlPanel";
import EmbeddedProtocols from "./pages/EmbeddedProtocols";

export const DHTContext = createContext(null);

/**
 * Main App Component
 * This component serves as the root of the application, managing global state and routing.
  * It establishes a WebSocket connection to receive real-time data from DHT sensors connected to an ESP32 device. The component maintains state for the latest sensor readings, historical data, and WebSocket connection status. It uses React Router to define routes for different pages of the application, including the DHT sensor dashboard, GPS page, RTLS page, beacons page, control panel, and embedded protocols page. The DHTContext is used to provide sensor data and connection status to child components that need access to this information. The component also implements a reconnection strategy for the WebSocket connection using exponential backoff to ensure reliable data streaming from the ESP32 device. Overall, this component serves as the central hub for managing state and routing in the IoT dashboard application.  
 * @returns 
 */
export default function App() {
  const [sensors, setSensors] = useState({});      // { id: latestDht }
  const [history, setHistory] = useState({});      // { id: [samples] }
  const [wsState, setWsState] = useState({
    connected: false,
    reconnecting: false,
    attempts: 0,
  });

  useEffect(() => {
    let ws;
    let timeoutId;

    const connect = (attempt = 0) => {
      const backoff = Math.min(1000 * 2 ** attempt, 15000);

      ws = new WebSocket("ws://192.168.0.92:1880/ws/dht");

      ws.onopen = () => {
        setWsState({ connected: true, reconnecting: false, attempts: 0 });
      };

      ws.onclose = () => {
        setWsState({ connected: false, reconnecting: true, attempts: attempt + 1 });
        timeoutId = setTimeout(() => connect(attempt + 1), backoff);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (
            data.type === "dht" &&
            data.temperature !== undefined &&
            data.humidity !== undefined &&
            data.id
          ) {
            const enriched = { ...data, lastSeen: Date.now() };
            const id = enriched.id;

            setSensors((prev) => ({
              ...prev,
              [id]: enriched,
            }));

            setHistory((prev) => {
              const prevArr = prev[id] || [];
              const nextArr = [
                ...prevArr.slice(-499),
                {
                  ts: enriched.ts,
                  time: new Date().toLocaleTimeString(),
                  temperature: enriched.temperature,
                  humidity: enriched.humidity,
                },
              ];
              return { ...prev, [id]: nextArr };
            });
          }
        } catch (e) {
          console.error("Invalid WS message:", e);
        }
      };
    };

    connect(0);

    return () => {
      if (ws) ws.close();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const ctxValue = useMemo(
    () => ({
      sensors,
      history,
      wsState,
    }),
    [sensors, history, wsState]
  );

  return (
    <DHTContext.Provider value={ctxValue}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<DHTPage />} />
          <Route path="/gps" element={<GPSPage />} />
          <Route path="/rtls" element={<RTLSPage />} />
          <Route path="/beacons" element={<BeaconsPage />} />
          <Route path="/control-panel" element={<ControlPanel />} />         
          <Route path="/embedded-protocols_ts" element={<EmbeddedProtocols />} />
        </Routes>
      </BrowserRouter>
    </DHTContext.Provider>
  );
}
