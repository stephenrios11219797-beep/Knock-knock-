"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import ActionPanel from "./ActionPanel"; // ✅ RESTORED

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [showSeverity, setShowSeverity] = useState(false);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME BUTTON */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link
          href="/"
          style={{ padding: 8, background: "white", borderRadius: 999 }}
        >
          ← Home
        </Link>
      </div>

      {/* ACTION PANEL — THIS WAS MISSING */}
      <ActionPanel />

      {/* SEVERITY MODAL (unchanged) */}
      {showSeverity && (
        <div
          style={{
            position: "fixed",
            bottom: 130,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 22,
            borderRadius: 18,
            width: 320,
            zIndex: 200,
          }}
        >
          <div style={{ fontSize: 16, marginBottom: 10 }}>
            Roof Damage Severity
          </div>

          <input
            type="range"
            min={0}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            style={{ width: "100%" }}
          />

          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              marginTop: 12,
              width: "100%",
              height: 80,
              borderRadius: 8,
              border: "1px solid #d1d5db",
              padding: 10,
              fontSize: 16,
            }}
          />

          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <button style={{ padding: "10px 16px", fontSize: 16 }}>
              Save
            </button>
            <button
              onClick={() => setShowSeverity(false)}
              style={{ padding: "10px 16px", fontSize: 16 }}
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
