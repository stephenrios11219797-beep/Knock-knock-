"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_OPTIONS = [
  { label: "Walked", color: "#22c55e" },
  { label: "No Answer", color: "#ef4444" },
  { label: "Soft Set", color: "#06b6d4" },
  { label: "Contingency", color: "#a855f7" },
  { label: "Contract", color: "#f59e0b" },
];

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const userMarkerRef = useRef(null);
  const draftPinRef = useRef(null);

  const followRef = useRef(true);
  const logModeRef = useRef(false);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [logMode, setLogMode] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  /* ---------------- MAP INIT (ONCE) ---------------- */
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    map.on("click", (e) => {
      if (!logModeRef.current) return;

      draftPinRef.current?.remove();

      draftPinRef.current = new mapboxgl.Marker({
        color: "#9ca3af",
      })
        .setLngLat(e.lngLat)
        .addTo(map);

      setShowStatusPicker(true);
    });

    mapRef.current = map;

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
    };
  }, []);

  /* ---------------- GPS ---------------- */
  const enableGPS = () => {
    if (gpsEnabled) return;

    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        const lngLat = [longitude, latitude];

        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            color: "#2563eb",
          })
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }

        // 🔒 TRUE FREE LOOK
        if (!followRef.current) return;

        mapRef.current.stop();
        mapRef.current.easeTo({
          center: lngLat,
          zoom: 18,
          duration: 500,
        });
      },
      () => alert("GPS permission denied"),
      { enableHighAccuracy: true }
    );
  };

  /* ---------------- FOLLOW TOGGLE ---------------- */
  const toggleFollow = () => {
    followRef.current = !followRef.current;
    setFollow(followRef.current);

    if (!followRef.current) {
      mapRef.current?.stop();
    }
  };

  /* ---------------- LOG HOUSE ---------------- */
  const startLogHouse = () => {
    logModeRef.current = true;
    setLogMode(true);
    setShowStatusPicker(false);
  };

  const cancelLogHouse = () => {
    draftPinRef.current?.remove();
    draftPinRef.current = null;
    logModeRef.current = false;
    setLogMode(false);
    setShowStatusPicker(false);
  };

  const savePin = (color) => {
    if (!draftPinRef.current) return;

    const lngLat = draftPinRef.current.getLngLat();
    draftPinRef.current.remove();

    new mapboxgl.Marker({ color })
      .setLngLat(lngLat)
      .addTo(mapRef.current);

    draftPinRef.current = null;
    logModeRef.current = false;
    setLogMode(false);
    setShowStatusPicker(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME — SMALL PILL */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link href="/" style={pillBtn}>
          Home
        </Link>
      </div>

      {/* RIGHT — GPS / FOLLOW (UNCHANGED STYLE) */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        {!gpsEnabled && (
          <button style={pillBtn} onClick={enableGPS}>
            GPS
          </button>
        )}
        {gpsEnabled && (
          <button style={pillBtn} onClick={toggleFollow}>
            {follow ? "Lock" : "Free"}
          </button>
        )}
      </div>

      {/* LOG HOUSE — SAME BUTTON, STATE FEEDBACK */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          gap: 10,
        }}
      >
        <button
          style={{
            ...pillBtn,
            background: logMode ? "#22c55e" : "rgba(255,255,255,0.9)",
            color: logMode ? "white" : "black",
          }}
          onClick={startLogHouse}
        >
          {logMode ? "Tap Map to Drop Pin" : "Log House"}
        </button>

        {logMode && (
          <button style={pillBtn} onClick={cancelLogHouse}>
            Cancel
          </button>
        )}
      </div>

      {/* STATUS PICKER */}
      {showStatusPicker && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 12,
            borderRadius: 12,
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => savePin(opt.color)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 10,
                background: "white",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: opt.color,
                }}
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------- EXACT PILL STYLE (UNCHANGED) --------- */
const pillBtn = {
  padding: "6px 12px",
  fontSize: 13,
  borderRadius: 999,
  background: "rgba(255,255,255,0.9)",
  border: "none",
  fontWeight: 600,
};
