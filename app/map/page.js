"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_OPTIONS = [
  { key: "walked", label: "Walked", color: "#22c55e" },
  { key: "no_answer", label: "No Answer", color: "#ef4444" },
  { key: "soft_set", label: "Soft Set", color: "#06b6d4" },
  { key: "contingency", label: "Contingency", color: "#a855f7" },
  { key: "contract", label: "Contract", color: "#f59e0b" },
];

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const userMarkerRef = useRef(null);
  const draftPinRef = useRef(null);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [logMode, setLogMode] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

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

      draftPinRef.current?.remove();

      draftPinRef.current = new mapboxgl.Marker({ color: "#9ca3af" })
        .setLngLat(e.lngLat)
        .addTo(mapRef.current);

      setShowStatusPicker(true);
    });

    return () => {
      watchIdRef.current &&
        navigator.geolocation.clearWatch(watchIdRef.current);
      mapRef.current?.remove();
    };
  }, [logMode]);

  /* ---------------- GPS ---------------- */
  const enableGPS = () => {
    if (gpsEnabled) return;

    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;

        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            color: "#2563eb",
          })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        } else {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        }

        // 🔑 HARD STOP FOLLOW WHEN FREE LOOK
        if (follow) {
          mapRef.current.stop(); // cancel any active animation
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
            duration: 500,
          });
        }
      },
      () => alert("GPS permission denied"),
      { enableHighAccuracy: true }
    );
  };

  /* ---------------- FREE LOOK TOGGLE ---------------- */
  const toggleFollow = () => {
    setFollow((prev) => {
      if (prev === true) {
        mapRef.current?.stop(); // 🔑 stop snap-back immediately
      }
      return !prev;
    });
  };

  /* ---------------- LOG HOUSE ---------------- */
  const startLogHouse = () => {
    setLogMode(true);
    setShowStatusPicker(false);
  };

  const cancelLogHouse = () => {
    draftPinRef.current?.remove();
    draftPinRef.current = null;
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
    setLogMode(false);
    setShowStatusPicker(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link href="/" style={btnStyle}>
          ← Home
        </Link>
      </div>

      {/* GPS + FOLLOW (UNCHANGED POSITION / SIZE) */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        {!gpsEnabled && (
          <button style={btnStyle} onClick={enableGPS}>
            Enable GPS
          </button>
        )}
        {gpsEnabled && (
          <button style={btnStyle} onClick={toggleFollow}>
            {follow ? "Following" : "Free Look"}
          </button>
        )}
      </div>

      {/* LOG HOUSE */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          gap: 12,
        }}
      >
        <button
          style={{
            ...btnStyle,
            background: logMode ? "#22c55e" : "white",
            color: logMode ? "white" : "black",
          }}
          onClick={startLogHouse}
        >
          {logMode ? "Tap Map to Drop Pin" : "Log House"}
        </button>

        {logMode && (
          <button style={btnStyle} onClick={cancelLogHouse}>
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
            padding: 14,
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            zIndex: 60,
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => savePin(opt.color)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "white",
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
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

const btnStyle = {
  padding: "10px 14px",
  background: "white",
  borderRadius: 10,
  fontWeight: 600,
  border: "1px solid #ddd",
};
