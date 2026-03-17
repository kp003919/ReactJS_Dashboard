import { useEffect, useState } from "react";

export default function Dashboard() {
  const [beacons, setBeacons] = useState([]);
  const [dht, setDht] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:1880/ws/beacons");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "rtls") {
        setBeacons(data.beacons);
      }

      if (data.type === "dht") {
        setDht({ temp: data.temperature, hum: data.humidity });
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Beacons</h2>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>RSSI</th>
            <th>Battery</th>
            <th>Type</th>
            <th>Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {beacons.map((b) => (
            <tr key={b.beacon_id}>
              <td>{b.beacon_id}</td>
              <td>{b.rssi}</td>
              <td>{b.battery}</td>
              <td>{b.type}</td>
              <td>{b.lastSeen}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "30px" }}>DHT Sensor</h2>
      {dht && (
        <p>
          Temperature: {dht.temp}°C<br />
          Humidity: {dht.hum}%
        </p>
      )}
    </div>
  );
}
