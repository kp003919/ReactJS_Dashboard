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
          <Route path="/embedded-protocols" element={<EmbeddedProtocols />} />
        </Routes>
      </BrowserRouter>
    </DHTContext.Provider>
  );
}
