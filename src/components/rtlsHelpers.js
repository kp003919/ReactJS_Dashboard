// Smooth linear interpolation for animated movement
export const lerp = (a, b, t) => a + (b - a) * t;

// Device type detection based on MAC prefix
export const getDeviceType = (mac) => {
  if (!mac) return "beacon";

  const prefix = mac.slice(0, 2).toUpperCase();

  // Example vendor groupings
  if (["AA", "BB", "CC"].includes(prefix)) return "phone";
  if (["DD", "EE", "FF"].includes(prefix)) return "tag";

  return "beacon";
};

// Keep coordinates inside the map (0–100%)
export const normalizeCoords = (x, y) => {
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  };
};

// Convert RSSI/distance into rough X/Y coordinates
export const triangulate = (beacon) => {
  if (!beacon || typeof beacon.distance !== "number") {
    return { x: 50, y: 50 }; // center fallback
  }

  // Convert last 2 hex digits of MAC into a pseudo-angle
  const angle =
    ((parseInt(beacon.mac.slice(-2), 16) % 360) * Math.PI) / 180;

  // Convert distance into a radius (scaled)
  const radius = Math.min(beacon.distance * 8, 40);

  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  return normalizeCoords(x, y);
};

// Online/offline color mapping (optional)
export const getStatusColor = (status) => {
  if (status === "online") return "#4caf50";
  if (status === "offline") return "#f44336";
  return "#9e9e9e";
};
