// src/pages/RTLSPage.jsx
import React, {
  useMemo,
  useState,
  useCallback,
} from "react";
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
  const creds = useAwsCredentials(
    "eu-west-2:62e6c7b7-bd74-43bc-8b55-007a8a972d22"
  );

  const [simMode, setSimMode] = useState(true);
  const [dark, setDark] = useState(true);

  const toggleSim = useCallback(
    () => setSimMode((s) => !s),
    []
  );
  const toggleDark = useCallback(
    () => setDark((d) => !d),
    []
  );

  const beaconsRaw = useRtlsMqtt({
    endpoint: "a3cv66lhwjj8z4-ats.iot.eu-west-2.amazonaws.com",
    region: "eu-west-2",
    credentials: creds,
    simulation: simMode,
  });

  const beacons = useMemo(
    () => (Array.isArray(beaconsRaw) ? beaconsRaw : []),
    [beaconsRaw]
  );

  const [selectedBeacon, setSelectedBeacon] = useState(null);
  const handleBeaconClick = useCallback(
    (b) => setSelectedBeacon(b),
    []
  );
  const handleDrawerClose = useCallback(
    () => setSelectedBeacon(null),
    []
  );

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
      { id: "A10", x: 25, y: 70 },
    ],
    []
  );

  const ZONES = useMemo(
    () => [
      {
        id: "loading",
        name: "Loading Bay",
        xMin: 0,
        xMax: 30,
        yMin: 60,
        yMax: 100,
      },
      {
        id: "storage",
        name: "Storage Area",
        xMin: 30,
        xMax: 80,
        yMin: 20,
        yMax: 70,
      },
      {
        id: "office",
        name: "Office",
        xMin: 80,
        xMax: 100,
        yMin: 0,
        yMax: 30,
      },
    ],
    []
  );

  // Anchor health: simple “seen recently” metric
  const anchorHealth = useMemo(() => {
    const now = Date.now();
    return ANCHORS.map((a) => {
      const seenBy = beacons.filter(
        (b) => b.anchorId === a.id || b.closestAnchor === a.id
      );
      const lastSeen = seenBy.reduce(
        (acc, b) =>
          b.lastSeen && b.lastSeen > acc ? b.lastSeen : acc,
        0
      );
      const offline =
        !lastSeen || now - lastSeen > 10_000;
      return {
        id: a.id,
        count: seenBy.length,
        lastSeen,
        offline,
      };
    });
  }, [ANCHORS, beacons]);

  // Zone occupancy / heatmap
  const zoneStats = useMemo(() => {
    const stats = ZONES.map((z) => ({
      ...z,
      count: 0,
    }));
    beacons.forEach((b) => {
      if (b.x == null || b.y == null) return;
      stats.forEach((z) => {
        if (
          b.x >= z.xMin &&
          b.x <= z.xMax &&
          b.y >= z.yMin &&
          b.y <= z.yMax
        ) {
          z.count += 1;
        }
      });
    });
    return stats;
  }, [ZONES, beacons]);

  // Simple clustering: group beacons by zone id (or “unassigned”)
  const clusters = useMemo(() => {
    const map = new Map();
    beacons.forEach((b) => {
      const key = b.zoneId || "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    });
    return Array.from(map.entries()).map(
      ([zoneId, list]) => ({
        zoneId,
        beacons: list,
      })
    );
  }, [beacons]);

  const bg = dark ? "#020617" : "#f5f5f5";
  const fg = dark ? "#e5e7eb" : "#111827";
  const cardBg = dark ? "#020617" : "#ffffff";
  const panelBg = dark ? "#020617" : "#ffffff";
  const subtle = "#6b7280";
  const border = dark ? "#1f2937" : "#e5e7eb";

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1400,
        margin: "0 auto",
        background: bg,
        minHeight: "100vh",
        color: fg,
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            📡 Real-Time Location System
          </h2>
          <p
            style={{
              marginTop: 4,
              color: subtle,
              fontSize: 14,
            }}
          >
            Live beacons, anchors, zones, clustering, and signal
            trends.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: `1px solid ${
                simMode ? "#f97316" : "#22c55e"
              }`,
              color: simMode ? "#f97316" : "#22c55e",
              background: dark ? "#020617" : "#ffffff",
            }}
          >
            {simMode ? "SIMULATION" : "LIVE ESP32"}
          </span>

          <button
            onClick={toggleSim}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: panelBg,
              color: fg,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {simMode
              ? "Switch to REAL mode"
              : "Switch to SIM mode"}
          </button>

          <button
            onClick={toggleDark}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${border}`,
              background: panelBg,
              color: fg,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </header>

      {/* Top row: summary + anchor health + alerts */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 2fr 2fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: cardBg,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${border}`,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            System Summary
          </h3>
          <RTLSSummary beacons={beacons} />
        </div>

        <div
          style={{
            background: cardBg,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${border}`,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            Anchor Health
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
              fontSize: 13,
            }}
          >
            {anchorHealth.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: dark
                    ? "#020617"
                    : "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    {a.id}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: a.offline
                        ? "#f97373"
                        : "#22c55e",
                    }}
                  >
                    {a.offline ? "Offline" : "Healthy"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: subtle,
                  }}
                >
                  <span>Beacons: {a.count}</span>
                  <span>
                    Last seen:{" "}
                    {a.lastSeen
                      ? `${Math.floor(
                          (Date.now() - a.lastSeen) /
                            1000
                        )}s ago`
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: cardBg,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${border}`,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            Alerts & Zones
          </h3>
          <RTLSAlerts beacons={beacons} zones={ZONES} />
        </div>
      </section>

      {/* Middle row: main map + mini-map + distance rings */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: cardBg,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${border}`,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            Floor Map
          </h3>
          <RTLSFloorMap
            beacons={beacons}
            anchors={ANCHORS}
            zones={ZONES}
            onBeaconClick={handleBeaconClick}
            dark={dark}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr 1fr",
            gap: 16,
          }}
        >
          <div
            style={{
              background: cardBg,
              borderRadius: 16,
              padding: 16,
              border: `1px solid ${border}`,
            }}
          >
            <h3
              style={{ marginTop: 0, marginBottom: 8 }}
            >
              Mini‑map Overview
            </h3>
            <div
              style={{
                width: "100%",
                height: 160,
                borderRadius: 12,
                border: `1px dashed ${border}`,
                fontSize: 12,
                color: subtle,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* You can replace this with a real mini‑map component later */}
              Mini‑map placeholder (zoomed‑out view)
            </div>
          </div>

          <div
            style={{
              background: cardBg,
              borderRadius: 16,
              padding: 16,
              border: `1px solid ${border}`,
            }}
          >
            <h3
              style={{ marginTop: 0, marginBottom: 8 }}
            >
              Distance Rings
            </h3>
            <RTLSDistanceRings
              beacons={beacons}
              anchors={ANCHORS}
              dark={dark}
            />
          </div>
        </div>
      </section>

      {/* Bottom row: RSSI chart + clusters + beacon list */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 16,
        }}
      >
        <div
          style={{
            background: cardBg,
            borderRadius: 16,
            padding: 16,
            border: `1px solid ${border}`,
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>
            RSSI Trends
          </h3>
          <div style={{ width: "100%", height: 320 }}>
            <RTLSRSSIChart beacons={beacons} dark={dark} />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateRows: "auto 1fr",
            gap: 12,
          }}
        >
          {/* Zone heatmap / clustering */}
          <div
            style={{
              background: cardBg,
              borderRadius: 16,
              padding: 16,
              border: `1px solid ${border}`,
            }}
          >
            <h3
              style={{ marginTop: 0, marginBottom: 8 }}
            >
              Zone Heatmap & Clusters
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 8,
                fontSize: 12,
              }}
            >
              {zoneStats.map((z) => {
                const intensity = Math.min(
                  z.count / 10,
                  1
                );
                const bgHeat = dark
                  ? `rgba(248, 113, 113, ${intensity})`
                  : `rgba(248, 113, 113, ${intensity})`;
                return (
                  <div
                    key={z.id}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                      background:
                        intensity > 0
                          ? bgHeat
                          : dark
                          ? "#020617"
                          : "#f9fafb",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {z.name}
                    </div>
                    <div
                      style={{
                        color: subtle,
                        fontSize: 11,
                      }}
                    >
                      Beacons: {z.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Beacon list with sparkline‑ready cards */}
          <div
            style={{
              background: cardBg,
              borderRadius: 16,
              padding: 16,
              border: `1px solid ${border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{ marginTop: 0, marginBottom: 8 }}
            >
              Beacons
            </h3>
            {beacons.length === 0 ? (
              <p
                style={{
                  color: subtle,
                  fontSize: 13,
                }}
              >
                Waiting for live MQTT beacons…
              </p>
            ) : (
              <div
                style={{
                  overflowY: "auto",
                  maxHeight: 260,
                  paddingRight: 4,
                }}
              >
                {clusters.map((cluster) => (
                  <div
                    key={cluster.zoneId}
                    style={{ marginBottom: 8 }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: subtle,
                        marginBottom: 4,
                      }}
                    >
                      Zone:{" "}
                      {cluster.zoneId === "unassigned"
                        ? "Unassigned"
                        : cluster.zoneId}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 6,
                      }}
                    >
                      {cluster.beacons.map((beacon) => (
                        <div
                          key={beacon.mac}
                          onClick={() =>
                            handleBeaconClick(beacon)
                          }
                          style={{
                            cursor: "pointer",
                            borderRadius: 10,
                            border: `1px solid ${border}`,
                            padding: 6,
                            background: dark
                              ? "#020617"
                              : "#f9fafb",
                          }}
                        >
                          {/* BeaconCard can be extended to show RSSI sparkline using history */}
                          <BeaconCard
                            beacon={beacon}
                            dark={dark}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <BeaconHistoryDrawer
        beacon={selectedBeacon}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
