// src/pages/RTLSPage.jsx
import React, { useMemo, useState } from "react";
import "../css/RTLSPage.css";

import RTLSSummary from "../components/RTLSSummary";
import RTLSFloorMap from "../components/RTLSFloorMap";
import RTLSAlerts from "../components/RTLSAlerts";
import RTLSDistanceRings from "../components/RTLSDistanceRings";
import RTLSRSSIChart from "../components/RTLSRSSIChart";
import BeaconCard from "../components/BeaconCard/BeaconCard";
import BeaconHistoryDrawer from "../components/BeaconHistoryDrawer";

import { useAwsCredentials } from "../components/useAwsCredentials";
import { useRtlsMqtt } from "../components/useRtlsMqtt";

export default function RTLSPage() {
  // 1) Load AWS credentials from Cognito
  const creds = useAwsCredentials("eu-west-2:62e6c7b7-bd74-43bc-8b55-007a8a972d22");

  // ⭐ Simulation toggle
  const [simMode, setSimMode] = useState(true);

  // 2) Connect to AWS IoT MQTT OR Simulation
  const beaconsRaw = useRtlsMqtt({
    endpoint: "a3cv66lhwjj8z4-ats.iot.eu-west-2.amazonaws.com",
    region: "eu-west-2",
    credentials: creds,
    simulation: simMode
  });

  // 3) Always ensure array
  const beacons = Array.isArray(beaconsRaw) ? beaconsRaw : [];

  const [selectedBeacon, setSelectedBeacon] = useState(null);

  // Anchors & zones
const ANCHORS = useMemo(
  () => [
    { id: "A1", x: 10, y: 10 },
    { id: "A2", x: 25, y: 10 },
    { id: "A3", x: 40, y: 10 },

    { id: "A4", x: 10, y: 30 },
    { id: "A5", x: 25, y: 30 },
    { id: "A6", x: 40, y: 30 },

    { id: "A7", x: 10, y: 50 },
    { id: "A8", x: 25, y: 50 },
    { id: "A9", x: 40, y: 50 },

    { id: "A10", x: 25, y: 70 }
  ],
  []
);




  const ZONES = useMemo(
    () => [
      { id: "loading", name: "Loading Bay", xMin: 0, xMax: 30, yMin: 60, yMax: 100 },
      { id: "storage", name: "Storage Area", xMin: 30, xMax: 80, yMin: 20, yMax: 70 },
      { id: "office", name: "Office", xMin: 80, xMax: 100, yMin: 0, yMax: 30 }
    ],
    []
  );

  const handleBeaconClick = (beacon) => setSelectedBeacon(beacon);
  const handleDrawerClose = () => setSelectedBeacon(null);

  return (
    <div className="rtls-page">
      <header className="rtls-header">
        <h2>Real-Time Location System</h2>
        <p className="rtls-subtitle">
          Live beacons, zones, alerts, and signal trends.
        </p>

        {/* ⭐ Simulation Toggle Button */}
        <button
          className="sim-toggle-btn"
          onClick={() => setSimMode(!simMode)}
        >
          {simMode ? "Switch to REAL ESP32 Mode" : "Switch to SIMULATION Mode"}
        </button>
      </header>

      {/* Top row: summary + alerts */}
      <section className="rtls-row rtls-row-top">
        <div className="rtls-panel">
          <RTLSSummary beacons={beacons} />
        </div>
        <div className="rtls-panel">
          <RTLSAlerts beacons={beacons} zones={ZONES} />
        </div>
      </section>

      {/* Middle row: floor map + distance rings */}
      <section className="rtls-row rtls-row-middle">
        <div className="rtls-panel rtls-panel-large">
          <RTLSFloorMap
            beacons={beacons}
            anchors={ANCHORS}
            zones={ZONES}
            onBeaconClick={handleBeaconClick}
          />
        </div>
        <div className="rtls-panel">
          <RTLSDistanceRings beacons={beacons} anchors={ANCHORS} />
        </div>
      </section>

      {/* Bottom row: RSSI chart + beacon list */}
      <section className="rtls-row rtls-row-bottom">
        <div className="rtls-panel rtls-panel-large">
          <div style={{ width: "100%", height: 400 }}>
            <RTLSRSSIChart beacons={beacons} />
          </div>
        </div>

        <div className="rtls-panel rtls-beacon-list-panel">
          <h3>Beacons</h3>
          {beacons.length === 0 ? (
            <p className="rtls-muted">Waiting for live MQTT beacons…</p>
          ) : (
            <div className="rtls-beacon-list">
              {beacons.map((beacon) => (
                <div
                  key={beacon.mac}
                  className="rtls-beacon-list-item"
                  onClick={() => handleBeaconClick(beacon)}
                >
                  <BeaconCard beacon={beacon} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* History drawer */}
      <BeaconHistoryDrawer
        beacon={selectedBeacon}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
