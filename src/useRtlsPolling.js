import { useEffect, useState } from "react";

export function useRtlsPolling() {
  const [beacons, setBeacons] = useState([]);

  useEffect(() => {
    async function fetchRTLS() {
      try {
        const res = await fetch(
          "https://0oblcr2phd.execute-api.eu-west-2.amazonaws.com/prod/rtls"
        );
        const json = await res.json();
        setBeacons(json.rtls || []);
      } catch (err) {
        console.error("RTLS fetch error:", err);
      }
    }

    fetchRTLS();
    const interval = setInterval(fetchRTLS, 1500); // 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  return beacons;
}
