"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_COLORS = {
  walked: "#22c55e",
  no_answer: "#ef4444",
  soft_set: "#eab308",
  contingency: "#a855f7",
  contract: "#f59e0b",
};

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);
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

      if (draftPinRef.current) {
        draftPinRef.current.remove();
      }

      draftPinRef.current = new mapboxgl.Marker({
        color: "#9ca3af", // gray draft
      })
        .setLngLat(e.lngLat)
        .addTo(mapRef.current);

      setShowStatusPicker(true);
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

  /* ---------------- SAVE PIN ---------------- */
  const savePin = (color) => {
    if (!draftPinRef.current) return;

    const lngLat = draftPinRef.current.getLngLat();
    draftPinRef.current.remove();

    new mapboxgl.Marker({ color })
      .setLngLat(lngLat)
      .addTo(mapRef.current);

    draftPinRef.current = null;
    setShowStatusPicker(false);
    setLogMode(false);
  };

  /* ---------------- CANCEL ---------------- */
  const cancelLog = () => {
    draftPinRef.current?.remove();
    draftPinRef.current = null;
    setShowStatusPicker(false);
    setLogMode(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* TOP LEFT — HOME */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link
          href="/"
          style={{
            padding: "8px 12px",
            background: "white",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Home
        </Link>
      </div>

      {/* TOP RIGHT — GPS / FREE LOOK */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        {!gpsEnabled && (
          <button onClick={enableGPS}>Enable GPS</button>
        )}
        {gpsEnabled && (
          <button onClick={() => setFollow(!follow)}>
            {follow ? "Following" : "Free Look"}
          </button>
        )}
      </div>

      {/* BOTTOM — LOG HOUSE */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
        }}
      >
        {!logMode && (
          <button onClick={() => setLogMode(true)}>Log House</button>
        )}
        {logMode && (
          <button onClick={cancelLog}>Cancel Log</button>
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
            borderRadius: 10,
            display: "flex",
            gap: 10,
            zIndex: 60,
          }}
        >
          {Object.entries(STATUS_COLORS).map(([key, color]) => (
            <button
              key={key}
              onClick={() => savePin(color)}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: color,
                border: "none",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
