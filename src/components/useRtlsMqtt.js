// src/components/useRtlsMqtt.js
import { useEffect, useState } from "react";
import mqtt from "mqtt";
import { signAwsIotUrl } from "../utils/signAwsIotUrl";

// 10 anchors, left-side grid (matches RTLSPage + firmware)
const SIM_ANCHORS = [
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
];

const DEVICE_TYPES = ["worker", "asset", "tag"];

// =============================
// RSSI / distance conversion
// =============================

function rssiFromDistance(distanceMeters) {
  const RSSI0 = -54;
  const n = 2.2;
  const d = Math.max(distanceMeters, 0.5);
  const rssi = RSSI0 - 10 * n * Math.log10(d);
  const noise = (Math.random() - 0.5) * 4; // ±2 dB
  return rssi + noise;
}

function distanceFromRssi(rssi) {
  const RSSI0 = -54;
  const n = 2.2;
  const exponent = (RSSI0 - rssi) / (10 * n);
  const d = Math.pow(10, exponent);
  return Math.max(d, 0.5);
}

// =============================
// True trilateration (least squares)
// =============================
function trilaterate(anchorsWithDist) {
  if (!anchorsWithDist || anchorsWithDist.length < 3) {
    return null;
  }

  const pts = anchorsWithDist.slice(0, 6); // cap for stability
  const ref = pts[0];

  const A = [];
  const b = [];

  for (let i = 1; i < pts.length; i++) {
    const pi = pts[i];

    const xi = pi.x;
    const yi = pi.y;
    const di = pi.distance;

    const x1 = ref.x;
    const y1 = ref.y;
    const d1 = ref.distance;

    const Ai = [
      2 * (xi - x1),
      2 * (yi - y1)
    ];

    const bi =
      di * di -
      d1 * d1 -
      xi * xi -
      yi * yi +
      x1 * x1 +
      y1 * y1;

    A.push(Ai);
    b.push(bi);
  }

  // Solve A * [x, y] = b via normal equations: (A^T A)p = A^T b
  let AtA = [
    [0, 0],
    [0, 0]
  ];
  let Atb = [0, 0];

  for (let i = 0; i < A.length; i++) {
    const Ai = A[i];
    const bi = b[i];

    AtA[0][0] += Ai[0] * Ai[0];
    AtA[0][1] += Ai[0] * Ai[1];
    AtA[1][0] += Ai[1] * Ai[0];
    AtA[1][1] += Ai[1] * Ai[1];

    Atb[0] += Ai[0] * bi;
    Atb[1] += Ai[1] * bi;
  }

  const det = AtA[0][0] * AtA[1][1] - AtA[0][1] * AtA[1][0];
  if (Math.abs(det) < 1e-6) {
    return null;
  }

  const invAtA = [
    [AtA[1][1] / det, -AtA[0][1] / det],
    [-AtA[1][0] / det, AtA[0][0] / det]
  ];

  const x =
    invAtA[0][0] * Atb[0] +
    invAtA[0][1] * Atb[1];

  const y =
    invAtA[1][0] * Atb[0] +
    invAtA[1][1] * Atb[1];

  return { x, y };
}

export function useRtlsMqtt({
  endpoint,
  region = "eu-west-2",
  topic = "rtls/live",
  credentials,
  simulation = false 
}) {
  const [beacons, setBeacons] = useState([]);

  // ============================================================
  // ⭐ HYBRID SIMULATION MODE (10 anchors + trilateration data)
  // ============================================================
  useEffect(() => {
    if (!simulation) return;

    console.log("RTLS Simulation Mode: ON (10 anchors)");

    const simulatedTags = [
      { mac: "SIM:01", x: 20, y: 20, vx: 0.35, vy: 0.25, type: "worker" },
      { mac: "SIM:02", x: 35, y: 25, vx: -0.30, vy: 0.20, type: "worker" },
      { mac: "SIM:03", x: 25, y: 55, vx: 0.25, vy: -0.40, type: "asset" },
      { mac: "SIM:04", x: 30, y: 40, vx: -0.20, vy: 0.15, type: "tag" },
      { mac: "SIM:05", x: 20, y: 35, vx: 0.15, vy: 0.35, type: "asset" },
      { mac: "SIM:06", x: 30, y: 65, vx: -0.25, vy: -0.30, type: "worker" }
    ];

    const interval = setInterval(() => {
      setBeacons((prev) => {
        return simulatedTags.map((tag) => {
          tag.x += tag.vx;
          tag.y += tag.vy;

          if (tag.x < 5 || tag.x > 45) tag.vx *= -1;
          if (tag.y < 5 || tag.y > 90) tag.vy *= -1;

          const prevBeacon = prev.find((b) => b.mac === tag.mac);
          const prevX = prevBeacon?.x ?? tag.x;
          const prevY = prevBeacon?.y ?? tag.y;

          const dx = tag.x - prevX;
          const dy = tag.y - prevY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const speed = dist * 3;

          const history = prevBeacon?.history || [];
          const newHistory = [...history.slice(-24), { x: tag.x, y: tag.y }];

          const anchorDistances = SIM_ANCHORS.map((a) => {
            const ax = a.x;
            const ay = a.y;
            const ddx = tag.x - ax;
            const ddy = tag.y - ay;
            const distPerc = Math.sqrt(ddx * ddx + ddy * ddy);
            const distMeters = (distPerc / 100) * 10;
            const rssi = rssiFromDistance(distMeters);

            return {
              anchorId: a.id,
              anchorX: a.x,
              anchorY: a.y,
              distanceMeters: distMeters,
              distancePerc: distPerc,
              rssi
            };
          });

          const closest = anchorDistances.reduce((min, d) =>
            d.distanceMeters < min.distanceMeters ? d : min
          );

          const deviceType =
            tag.type ||
            DEVICE_TYPES[Math.floor(Math.random() * DEVICE_TYPES.length)];

          return {
            mac: tag.mac,
            x: tag.x,
            y: tag.y,
            tagX: tag.x,
            tagY: tag.y,
            speed,
            history: newHistory,
            timestamp: Date.now(),
            rssi: closest.rssi,
            anchorId: closest.anchorId,
            anchorDistances,
            deviceType
          };
        });
      });
    }, 200);

    return () => clearInterval(interval);
  }, [simulation]);

  // ============================================================
  // ⭐ REAL MQTT MODE WITH TRILATERATION
  // ============================================================
  useEffect(() => {
    if (simulation) return;
    if (!credentials) return;

    let isMounted = true;
    let client = null;

    // tagDetections[mac][anchorId] = { anchorX, anchorY, rssi, updatedAt }
    const tagDetections = {};

    const { AccessKeyId, SecretKey, SessionToken } = credentials;

    const url = signAwsIotUrl({
      endpoint,
      region,
      accessKeyId: AccessKeyId,
      secretAccessKey: SecretKey,
      sessionToken: SessionToken
    });

    client = mqtt.connect(url, {
      protocol: "wss",
      clientId: "rtls-" + Math.random().toString(16).substring(2),
      keepalive: 30,
      reconnectPeriod: 3000
    });
   // 
    client.on("connect", () => {
      client.subscribe(topic);
    });

    client.on("message", (topicName, payload) => {
      if (!isMounted) return;

      try {
        const data = JSON.parse(payload.toString());
        if (data.type !== "rtls_detection") return;

        const mac = data.mac || data.tagMac;
        if (!mac) return;

        const anchorId = data.anchorId;
        const anchorX = data.anchorX;
        const anchorY = data.anchorY;
        const rssi = data.rssi;
        const ts = data.timestamp || Date.now();

        if (
          typeof anchorX !== "number" ||
          typeof anchorY !== "number" ||
          typeof rssi !== "number"
        ) {
          return;
        }

        if (!tagDetections[mac]) tagDetections[mac] = {};
        tagDetections[mac][anchorId] = {
          anchorId,
          anchorX,
          anchorY,
          rssi,
          updatedAt: ts
        };

        const now = Date.now();
        const STALE_MS = 5000;

        // Clean stale detections
        for (const tagMac of Object.keys(tagDetections)) {
          const anchorMap = tagDetections[tagMac];
          for (const aId of Object.keys(anchorMap)) {
            if (now - anchorMap[aId].updatedAt > STALE_MS) {
              delete anchorMap[aId];
            }
          }
          if (Object.keys(anchorMap).length === 0) {
            delete tagDetections[tagMac];
          }
        }

        setBeacons((prev) => {
          const newBeacons = [];

          for (const [tagMac, anchorMap] of Object.entries(tagDetections)) {
            const anchorsArr = Object.values(anchorMap);

            const anchorsWithDist = anchorsArr.map((a) => ({
              x: a.anchorX,
              y: a.anchorY,
              distance: distanceFromRssi(a.rssi),
              anchorId: a.anchorId,
              rssi: a.rssi
            }));

            let pos = null;
            if (anchorsWithDist.length >= 3) {
              pos = trilaterate(anchorsWithDist);
            }

            let x, y;
            if (pos && isFinite(pos.x) && isFinite(pos.y)) {
              x = pos.x;
              y = pos.y;
            } else {
              const strongest = anchorsWithDist.reduce((max, a) =>
                a.rssi > max.rssi ? a : max
              );
              x = strongest.x;
              y = strongest.y;
            }

            const prevBeacon = prev.find((b) => b.mac === tagMac);
            const prevX = prevBeacon?.x ?? x;
            const prevY = prevBeacon?.y ?? y;

            const dx = x - prevX;
            const dy = y - prevY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = dist * 3;

            const history = prevBeacon?.history || [];
            const newHistory = [...history.slice(-24), { x, y }];

            const avgRssi =
              anchorsWithDist.reduce((sum, a) => sum + a.rssi, 0) /
              anchorsWithDist.length;

            const anchorDistances = anchorsWithDist.map((a) => ({
              anchorId: a.anchorId,
              anchorX: a.x,
              anchorY: a.y,
              distanceMeters: a.distance,
              rssi: a.rssi
            }));

            newBeacons.push({
              mac: tagMac,
              x,
              y,
              tagX: x,
              tagY: y,
              speed,
              history: newHistory,
              rssi: avgRssi,
              anchorId: anchorsWithDist[0]?.anchorId,
              anchorDistances,
              timestamp: now,
              raw: anchorsArr
            });
          }

          return newBeacons;
        });
      } catch (e) {
        console.error("RTLS parse error:", e);
      }
    });

    return () => {
      isMounted = false;
      if (client) client.end(true);
    };
  }, [endpoint, region, topic, credentials, simulation]);

  return beacons;
}
