"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* ---------------- STATUS COLORS ---------------- */
const STATUS_COLORS = {
  unlogged: "#9ca3af",     // gray
  walked: "#16a34a",       // green
  no_answer: "#dc2626",    // red
  soft_set: "#eab308",     // yellow
  contingency: "#7c3aed", // purple
  contract: "#d97706",    // gold
};

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const activeMarkerRef = useRef(null);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [logMode, setLogMode] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  /* ---------------- MAP INIT ---------------- */
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current.on("click", (e) => {
      if (!logMode) return;

      // Remove previous active marker
      if (activeMarkerRef.current) {
        activeMarkerRef.current.remove();
      }

      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.background = STATUS_COLORS.unlogged;
      el.style.border = "2px solid white";

      const marker = new mapboxgl.Marker(el)
        .setLngLat(e.lngLat)
        .addTo(mapRef.current);

      activeMarkerRef.current = marker;

      setLogMode(false);
      setShowStatus(true);
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      mapRef.current?.remove();
    };
  }, [logMode]);

  /* ---------------- GPS ---------------- */
  const enableGPS = () => {
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;

        if (follow) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
          });
        }
      },
      () => alert("GPS permission denied"),
      { enableHighAccuracy: true }
    );
  };

  /* ---------------- STATUS APPLY ---------------- */
  const applyStatus = (status) => {
    if (!activeMarkerRef.current) return;

    const el = activeMarkerRef.current.getElement();
    el.style.background = STATUS_COLORS[status];

    setShowStatus(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* ---------- TOP LEFT ---------- */}
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          left: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <Link
          href="/"
          style={{
            pointerEvents: "auto",
            margin: 12,
            padding: "8px 12px",
            background: "white",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ← Home
        </Link>
      </div>

      {/* ---------- TOP RIGHT ---------- */}
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          right: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            margin: 12,
            pointerEvents: "auto",
          }}
        >
          {!gpsEnabled && (
            <button onClick={enableGPS}>GPS</button>
          )}
          {gpsEnabled && (
            <button onClick={() => setFollow((f) => !f)}>
              {follow ? "Locked" : "Free"}
            </button>
          )}
        </div>
      </div>

      {/* ---------- LOG HOUSE BUTTON ---------- */}
      <button
        onClick={() => setLogMode(true)}
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "14px 20px",
          background: "#2563eb",
          color: "white",
          borderRadius: 999,
          fontWeight: 600,
          zIndex: 50,
        }}
      >
        Log House
      </button>

      {/* ---------- STATUS SELECTOR ---------- */}
      {showStatus && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 12,
            borderRadius: 12,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            zIndex: 60,
          }}
        >
          <button onClick={() => applyStatus("walked")}>Walked</button>
          <button onClick={() => applyStatus("no_answer")}>No Answer</button>
          <button onClick={() => applyStatus("soft_set")}>Soft Set</button>
          <button onClick={() => applyStatus("contingency")}>Contingency</button>
          <button onClick={() => applyStatus("contract")}>Contract</button>
        </div>
      )}
    </div>
  );
}
