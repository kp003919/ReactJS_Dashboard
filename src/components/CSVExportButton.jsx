import React from "react";

import "../css/CSVExportButton.css";
/**
 * // CSVExportButton.jsx
 * // Component to export sensor data to CSV
 * // @param {Array} data - Array of sensor data objects  
 * // Each object should have deviceId, timestamp, temperature, humidity  
 * // Example data item:
 * // { deviceId: "esp32-1", timestamp: 1625247600000, temperature: 25.3, humidity: 60.5 }
 * @param {*} param0 
 * @returns {JSX.Element} CSV Export Button Component 
 */
export default function CSVExportButton({ data }) {
  const exportToCSV = () => {
    if (!data || data.length === 0) return;
    
    const header = "deviceId,timestamp,temperature,humidity\n";
    // Generate CSV rows
    // Format timestamp as ISO string for better readability  
    // Convert timestamp from number to ISO string  
    // Example: 1625247600000 -> 2021-07-02T15:00:00.000Z
    const rows = data
      .map(
        (item) =>
          `${item.deviceId},${item.timestamp},${item.temperature},${item.humidity}`
      )
      .join("\n");

    const csvContent = header + rows;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sensor_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
 // Render button to trigger CSV export
  return (
    <button onClick={exportToCSV}>
      Download CSV
    </button>
  );
}
