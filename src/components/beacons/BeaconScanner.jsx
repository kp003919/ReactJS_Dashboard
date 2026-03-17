import React from "react";
import BeaconTable from "./BeaconTable";
import useBleScanner from "../../hooks/useBleScanner";

export default function BeaconScanner({ onSelectBeacon }) {
  const { beacons, scanning, startScan, stopScan } = useBleScanner();

  return (
    <div className="card">
      <h3>Live Beacon Scanner</h3>

      <button onClick={scanning ? stopScan : startScan}>
        {scanning ? "Stop Scanning" : "Start Scanning"}
      </button>

      <p style={{ color: scanning ? "green" : "red" }}>
        {scanning ? "Scanning..." : "Not scanning"}
      </p>

      <BeaconTable beacons={beacons} onSelect={onSelectBeacon} />
    </div>
  );
}
