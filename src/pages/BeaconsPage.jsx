
/**
  * BeaconsPage.jsx 
  * This React component displays a live dashboard of BLE beacons detected by the ESP32
  *  and forwarded through Node-RED. It connects to a WebSocket server to receive real-time 
  * updates of beacon data, including RSSI, battery level, and type. The dashboard allows 
  * users to sort beacons by freshness, RSSI, or battery level, and includes a toggle to 
  * switch between showing all detected devices or only valid beacons with recognized manufacturer data (RTLS mode). 
  * The component also features a dark mode for improved readability in low-light environments.
  * 
  * The MQTT client is used to send commands back to the ESP32 via Node-RED when the RTLS 
  * mode toggle is switched. This page provides an interactive and visually appealing way to 
  * monitor BLE beacon activity in real time. 
  * 
  * Note: The WebSocket URL and MQTT URL are hardcoded for local testing and should be
  *  updated to match the actual server configuration when deployed. The component relies 
  * on the backend to send properly formatted beacon data through the WebSocket connection, 
  * and it assumes that the MQTT broker is set up to receive commands on the "anchor/commands"
  *  topic. Proper error handling is included for WebSocket messages, but additional validation  
  * may be necessary depending on the expected data format and use case.    
  * 
  * Included pages: 
  * - BeaconsPage.jsx (this file): Displays real-time beacon data with sorting and RTLS mode toggle.  
  * - DHT22Page.jsx: Displays temperature and humidity data from the DHT22 sensor.
  * - GPSPage.jsx: Displays GPS data including location, speed, and satellite information.
  * - RTLS.jsx: Contains the RTLS logic for processing BLE beacon data on the ESP32 and forwarding it to Node-RED.  
  * - Controls.jsx: Contains React components for controlling actuators (fan, heater, LEDs) via MQTT commands.  
  * The dashboard is designed to be responsive and user-friendly, providing a comprehensive overview of the IoT device's environment and status in real time. It serves as a central hub for monitoring and controlling the various sensors and actuators connected to the ESP32, making it an essential part of the overall IoT system.  
  *    
  * @abstract 
  * @author Muhsin Atto 
  * @version 1.0
  * @since 2024-06-01   
  * 
  * References:
  * - WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
  * - MQTT.js:      
  *  * License: MIT License 
  *   
*/
// import necessary libraries and dependencies  
import React, { useState, useEffect, useMemo } from "react";
import mqtt from "mqtt";  // MQTT client library for sending commands back to ESP32 via Node-RED  

/**
 * BeaconsPage Component
 * This component connects to a WebSocket server to receive real-time updates of BLE beacon 
 * data from the ESP32. It displays the beacons in a visually appealing dashboard, allowing 
 * users to sort by freshness, RSSI, or battery level. A toggle is included to switch between 
 * showing all detected devices or only valid beacons with recognized manufacturer data 
 * (RTLS mode). The component also features a dark mode for improved readability. MQTT is 
 * used to send commands back to the ESP32 when the RTLS mode toggle is switched.    
 *  
 * Note: The WebSocket URL and MQTT URL are hardcoded for local testing and should be
 *  updated to match the actual server configuration when deployed. The component relies 
 * on the backend to send properly formatted beacon data through the WebSocket connection,    
 * and it assumes that the MQTT broker is set up to receive commands on the "anchor/commands"
 *  topic. Proper error handling is included for WebSocket messages, but additional validation  
 * may be necessary depending on the expected data format and use case.    
 * 
 * @returns  JSX element representing the BeaconsPage component, which includes the dashboard UI and logic for handling real-time beacon data updates, sorting, and RTLS mode toggling.
 * 
 * @example
 * // Example usage of BeaconsPage component in a React application
 * import React from "react";
 */

export default function BeaconsPage() {
  // State variables for beacons data, dark mode, sorting key, and RTLS mode toggle 
  // beacons: array of beacon objects received from the WebSocket connection, each containing id, rssi, battery, type, and lastSeen properties. 
  const [beacons, setBeacons] = useState([]); 
  // dark: boolean state to toggle between dark mode and light mode for the dashboard UI.
  const [dark, setDark] = useState(true);
  // sortKey: string state to determine the current sorting key for the beacons list (e.g., "lastSeen", "rssi", "battery").
  const [sortKey, setSortKey] = useState("lastSeen");
  const [showAll, setShowAll] = useState(false); // NEW: RTLS mode toggle
  // WebSocket and MQTT URLs (update these to match your server configuration)
  const WS_URL = "ws://192.168.0.92:1880/ws/beacons";
  // MQTT_URL is used for sending commands back to the ESP32 via Node-RED when the RTLS mode toggle is switched. It should point to the MQTT broker's WebSocket port. 
  const MQTT_URL = "ws://192.168.0.92:9001"; // MQTT WebSocket port

  // MQTT client (persistent)
  const mqttClient = useMemo(() => mqtt.connect(MQTT_URL), []);

  // Convert ESP32 millis() → "X seconds/minutes ago"
  const timeAgo = (lastSeen) => {
    if (!lastSeen) return "—";

    const ageMs = performance.now() - lastSeen;
    const sec = Math.floor(ageMs / 1000);

    if (sec < 1) return "just now";
    if (sec < 60) return `${sec}s ago`;

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;

    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;

    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Re-render every second so "X seconds ago" stays fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setBeacons((prev) => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    // Handle incoming WebSocket messages containing beacon data  
    ws.onmessage = (event) => {
      try {
        // Parse the incoming message data as JSON and update the beacons state accordingly. The expected format of the incoming data is an object with a "type" property (which should be "rtls") and a "beacons" property, which is an array of beacon objects. Each beacon object should contain at least an "id" property, and may also include "rssi", "battery", and "type" properties. The function updates the existing beacons in the state by matching their IDs and updating their properties, or adds new beacons if they are not already in the state. The lastSeen property is updated to the current time for each beacon to allow for freshness sorting and display. Proper error handling is included to catch any issues with parsing the incoming message data.
        const data = JSON.parse(event.data);
        // Only process messages of type "rtls" that contain a beacons array  
        if (data.type === "rtls" && Array.isArray(data.beacons)) {
          const now = performance.now();
           // Update the beacons state with the new data, ensuring that existing beacons are updated and new beacons are added without duplicates. The function uses a Map to efficiently manage the beacons by their IDs, allowing for quick lookups and updates. Each beacon's properties (rssi, battery, type) are updated if they are present in the incoming data, and the lastSeen property is set to the current time to track when the beacon was last updated. This approach ensures that the dashboard reflects the most recent information about each beacon while maintaining a clean and efficient state management strategy.  
          setBeacons((prev) => {
            const map = new Map(prev.map((b) => [b.id, b]));
            // Process each beacon in the incoming data and update the map accordingly. If a beacon with the same ID already exists in the map, its properties are updated with the new values from the incoming data (if they are present). If a beacon with the same ID does not exist, a new entry is added to the map with the provided properties. The lastSeen property is updated to the current time for each processed beacon to allow for freshness tracking. This ensures that the state reflects the most up-to-date information about each beacon while avoiding duplicates and maintaining efficient updates. 
            data.beacons.forEach((b) => {
              if (!b || typeof b.id === "undefined") return;
                // Update existing beacon or add new beacon to the map based on the incoming data. The function checks if a beacon with the same ID already exists in the map. If it does, it updates the existing beacon's properties (rssi, battery, type) with the new values from the incoming data, if they are present. If a beacon with the same ID does not exist in the map, it creates a new entry with the provided properties. The lastSeen property is updated to the current time for each processed beacon to allow for freshness tracking and display in the dashboard. This approach ensures that the state remains accurate and up-to-date with the latest information about each beacon while maintaining efficient state management.  
              if (map.has(b.id)) {
                const existing = map.get(b.id);
                existing.rssi = b.rssi ?? existing.rssi;
                existing.battery = b.battery ?? existing.battery;
                existing.type = b.type ?? existing.type;
                existing.lastSeen = now;
              } else {
                map.set(b.id, {
                  id: b.id,
                  rssi: b.rssi ?? 0,
                  battery: b.battery ?? 0,
                  type: b.type ?? 0,
                  lastSeen: now,
                });
              }
            });

            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    };
    
    // Handle WebSocket errors by logging them to the console for debugging purposes. This allows developers to identify and troubleshoot issues with the WebSocket connection, such as connection failures, unexpected disconnections, or issues with the incoming message data. Proper error handling is crucial for maintaining a robust and reliable application, especially when dealing with real-time data streams like those from a WebSocket connection. By logging errors, developers can gain insights into potential problems and take appropriate actions to resolve them, ensuring a better user experience and smoother operation of the dashboard.  
    ws.onerror = (err) => console.error("WebSocket error:", err);
    return () => ws.close();
  }, []);

  // NEW: Send RTLS mode command to Node-RED → ESP32
  const toggleMode = () => {
    const newMode = !showAll;
    setShowAll(newMode);

    const payload = {
      rtlsMode: newMode ? "all" : "valid",
    };

    mqttClient.publish("anchor/commands", JSON.stringify(payload));
  };

  const freshnessColor = (lastSeen) => {
    const ageMs = performance.now() - lastSeen;

    if (ageMs < 3000) return dark ? "#0f3d0f" : "#d4ffd4";
    if (ageMs < 8000) return dark ? "#4d3b00" : "#fff7d4";
    return dark ? "#4d0000" : "#ffd4d4";
  };

  const sortedBeacons = useMemo(() => {
    return [...beacons].sort((a, b) => {
      if (sortKey === "rssi") return b.rssi - a.rssi;
      if (sortKey === "battery") return b.battery - a.battery;
      return b.lastSeen - a.lastSeen;
    });
  }, [beacons, sortKey]);

  const bg = dark ? "#020617" : "#f5f5f5";
  const fg = dark ? "#e5e7eb" : "#111827";
  const cardBg = dark ? "#0b1120" : "#ffffff";
  const border = dark ? "#1f2937" : "#e5e7eb";
  const subtle = "#6b7280";


  // Render the dashboard UI, including the header, sorting controls, RTLS mode toggle, and beacon cards. The UI is designed to be visually appealing and user-friendly, with a responsive layout that adapts to different screen sizes. The header includes a title and description of the dashboard, along with a toggle button for switching between dark mode and light mode. The sorting controls allow users to sort the displayed beacons by freshness, RSSI, or battery level. The RTLS mode toggle allows users to switch between showing all detected devices or only valid beacons with recognized manufacturer data. Each beacon is displayed in a card format that includes its ID, freshness indicator, RSSI bar, battery level, and type. The overall design emphasizes clarity and ease of use while providing real-time insights into the detected BLE beacons.  
  // The component also includes a message that is displayed when there are no beacons detected, providing feedback to the user while waiting for data to arrive. This ensures that the dashboard remains informative and engaging even when there is no active beacon data being received. The use of colors, spacing, and typography is carefully considered to create a visually appealing and intuitive interface for monitoring BLE beacon activity in real time.  
  // The dashboard serves as a central hub for monitoring the BLE environment around the ESP32, allowing users to quickly assess the presence and strength of nearby beacons, as well as their battery levels and types. This information can be crucial for applications such as asset tracking, proximity detection, or environmental monitoring, where understanding the BLE landscape is essential for making informed decisions or taking appropriate actions based on the detected beacons. 
  
  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
        background: bg,
        minHeight: "100vh",
        color: fg,
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>📡 Live Beacon Inspector</h2>
          <p style={{ marginTop: 4, color: subtle }}>
            Real‑time BLE packets from ESP32 → Node‑RED → WebSocket.
          </p>
        </div>

        <button
          onClick={() => setDark((d) => !d)}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${border}`,
            background: cardBg,
            color: fg,
            cursor: "pointer",
          }}
        >
          {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>

      {/* Sorting + RTLS Mode Toggle */}
      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <div>
          <label style={{ marginRight: 8, color: subtle }}>Sort by:</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: cardBg,
              color: fg,
            }}
          >
            <option value="lastSeen">Freshness</option>
            <option value="rssi">RSSI</option>
            <option value="battery">Battery</option>
          </select>
        </div>

        {/* NEW: RTLS Mode Toggle */}
        <button
          onClick={toggleMode}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: `1px solid ${border}`,
            background: cardBg,
            color: fg,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showAll ? "Showing ALL BLE devices" : "Showing VALID beacons only"}
        </button>
      </div>

      {/* Beacon cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {sortedBeacons.map((b) => (
          <div
            key={b.id}
            style={{
              background: cardBg,
              borderRadius: 16,
              padding: 16,
              border: `1px solid ${border}`,
              boxShadow: dark
                ? "0 10px 30px rgba(0,0,0,0.5)"
                : "0 10px 30px rgba(0,0,0,0.08)",
              transition: "0.2s",
            }}
          >
            <div
              style={{
                background: freshnessColor(b.lastSeen),
                padding: 8,
                borderRadius: 8,
                marginBottom: 12,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Beacon {b.id} — {timeAgo(b.lastSeen)}
            </div>

            {/* RSSI bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: subtle }}>RSSI</div>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  background: dark ? "#1e293b" : "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(Math.abs(b.rssi), 100)}%`,
                    height: "100%",
                    background: b.rssi > -70 ? "#22c55e" : "#f97316",
                  }}
                />
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{b.rssi} dBm</div>
            </div>

            {/* Battery */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: subtle }}>Battery</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {b.battery}%
              </div>
            </div>

            {/* Type */}
            <div>
              <div style={{ fontSize: 12, color: subtle }}>Type</div>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  border: `1px solid ${border}`,
                }}
              >
                {b.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      {beacons.length === 0 && (
        <p style={{ color: subtle, marginTop: 20 }}>
          Waiting for beacon packets…
        </p>
      )}
    </div>
  );
}
