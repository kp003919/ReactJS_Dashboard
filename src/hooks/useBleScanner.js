import { useState, useRef } from "react";

export default function useBleScanner() {
  const [beacons, setBeacons] = useState([]);
  const [scanning, setScanning] = useState(false);

  const scanRef = useRef(null);

  // Estimate distance from RSSI + TxPower
  const estimateDistance = (rssi, txPower = -59) => {
    const ratio = rssi / txPower;
    if (ratio < 1) return Math.pow(ratio, 10).toFixed(2);
    return (0.89976 * Math.pow(ratio, 7.7095) + 0.111).toFixed(2);
  };

  const startScan = async () => {
    try {
      setScanning(true);

      // Request BLE scan (FIXED: added active: true)
      scanRef.current = await navigator.bluetooth.requestLEScan({
        keepRepeatedDevices: true,
        acceptAllAdvertisements: true,
        active: true
      });

      navigator.bluetooth.addEventListener("advertisementreceived", (event) => {
        const id = event.device.id || event.device.name || "Unknown";

        setBeacons((prev) => {
          const existing = prev.find((b) => b.id === id);

          const rawPacket = event.manufacturerData.size
            ? [...event.manufacturerData.values()]
                .map((buf) => Array.from(new Uint8Array(buf)))
                .flat()
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(" ")
            : "N/A";

          const updated = {
            id,
            rssi: event.rssi,
            txPower: event.txPower ?? -59,
            distance: estimateDistance(event.rssi, event.txPower ?? -59),
            lastSeen: 0,
            rawPacket,
            rssiHistory: existing
              ? [...existing.rssiHistory.slice(-19), event.rssi]
              : [event.rssi]
          };

          const filtered = prev.filter((b) => b.id !== id);
          return [...filtered, updated];
        });
      });

      // Timer to update "last seen"
      const interval = setInterval(() => {
        setBeacons((prev) =>
          prev
            .map((b) => ({ ...b, lastSeen: b.lastSeen + 1 }))
            .filter((b) => b.lastSeen < 10)
        );
      }, 1000);

      scanRef.current.cleanup = () => clearInterval(interval);
    } catch (err) {
      console.error("BLE Scan Error:", err);
      setScanning(false);
    }
  };

  const stopScan = () => {
    setScanning(false);

    try {
      if (scanRef.current) {
        scanRef.current.stop();
        if (scanRef.current.cleanup) scanRef.current.cleanup();
      }
    } catch (err) {
      console.error("Stop Scan Error:", err);
    }
  };

  return { beacons, scanning, startScan, stopScan };
}
