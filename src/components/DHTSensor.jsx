import React from "react";

export default function DHTSensor({ latestData }) {
  // If no data yet, show a friendly message
  if (!latestData) {
    return <p>No sensor data available</p>;
  }

  return (
    <div style={styles.box}>
      <h3 style={styles.title}>DHT Sensor Readings</h3>

      <p style={styles.item}>
        <strong>Temperature:</strong> {latestData.temperature} °C
      </p>

      <p style={styles.item}>
        <strong>Humidity:</strong> {latestData.humidity} %
      </p>

      <p style={styles.timestamp}>
        <strong>Last Updated:</strong>{" "}
        {new Date(latestData.timestamp).toLocaleString()}
      </p>
    </div>
  );
}

const styles = {
  box: {
    padding: "20px",
    background: "#f4f4f4",
    borderRadius: "8px",
    width: "320px",
    marginTop: "20px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },
  title: {
    marginBottom: "10px",
  },
  item: {
    margin: "6px 0",
    fontSize: "16px",
  },
  timestamp: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#555",
  },
};
