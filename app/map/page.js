"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import ActionPanel from "./ActionPanel";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_OPTIONS = [
  { label: "Walked", color: "#16a34a" },
  { label: "No Answer", color: "#dc2626" },
  { label: "Soft Set", color: "#0ea5e9" },
  { label: "Contingency", color: "#7c3aed" },
  { label: "Contract", color: "#d4af37" },
  { label: "Not Interested", color: "#4b5563" },
];

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [loggingMode, setLoggingMode] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const pendingPinRef = useRef(null);

  /* ---------- MAP INIT ---------- */
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current = map;
  }, []);

  /* ---------- LOG HOUSE ---------- */
  const armLogHouse = () => {
    setLoggingMode(true);
  };

  const cancelLog = () => {
    pendingPinRef.current?.remove();
    pendingPinRef.current = null;
    setLoggingMode(false);
    setShowStatus(false);
  };

  const savePin = (status) => {
    pendingPinRef.current?.remove();
    pendingPinRef.current = null;
    setLoggingMode(false);
    setShowStatus(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME BUTTON (TOP LEFT) */}
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <Link
          href="/"
          style={{
            pointerEvents: "auto",
            padding: 8,
            background: "white",
            borderRadius: 999,
            display: "inline-block",
          }}
        >
          ← Home
        </Link>
      </div>

      {/* LOG HOUSE BUTTON */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
        }}
      >
        <button
          onClick={armLogHouse}
          style={{
            background: loggingMode ? "#16a34a" : "white",
            borderRadius: 999,
            padding: "12px 18px",
          }}
        >
          Log House
        </button>
      </div>

      {/* STATUS BUTTONS */}
      {showStatus && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 10,
            borderRadius: 12,
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "90vw",
            zIndex: 100,
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => savePin(s)}
              style={{
                background: s.color,
                color: "white",
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={cancelLog}
            style={{ fontSize: 12, padding: "6px 10px" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ACTION PANEL (THIS WAS MISSING) */}
      <ActionPanel />
    </div>
  );
}
