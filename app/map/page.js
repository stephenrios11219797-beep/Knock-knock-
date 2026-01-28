"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* --------- STATUS OPTIONS --------- */
const STATUS_OPTIONS = [
  { label: "Walked", color: "#22c55e" },
  { label: "No Answer", color: "#ef4444" },
  { label: "Not Interested", color: "#4b5563" },
  { label: "Soft Set", color: "#06b6d4" },
  { label: "Contingency", color: "#a855f7" },
  { label: "Contract", color: "#f59e0b" },
];

/* --------- DAY KEY --------- */
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const draftPinRef = useRef(null);
  const followRef = useRef(true);
  const logModeRef = useRef(false);
  const gpsStartedRef = useRef(false);

  const routeCoordsRef = useRef([]);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [logMode, setLogMode] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  /* ---------------- MAP INIT ---------------- */
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    map.on("load", () => {
      /* ---- ME DOT ---- */
      map.addSource("me", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "me-accuracy",
        type: "circle",
        source: "me",
        paint: {
          "circle-radius": ["get", "accuracy"],
          "circle-color": "#3b82f6",
          "circle-opacity": 0.2,
        },
      });

      map.addLayer({
        id: "me-dot",
        type: "circle",
        source: "me",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
        },
      });

      /* ---- ROUTE MEMORY ---- */
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] },
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 3,
          "line-opacity": 0.35,
        },
      });

      /* ---- RESTORE TODAY'S ROUTE ---- */
      const saved = JSON.parse(localStorage.getItem("route-memory") || "{}");
      const key = todayKey();

      if (saved.date === key && Array.isArray(saved.coords)) {
        routeCoordsRef.current = saved.coords;
        map.getSource("route")?.setData({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: routeCoordsRef.current,
          },
        });
      } else {
        localStorage.removeItem("route-memory");
      }
    });

    map.on("click", (e) => {
      if (!logModeRef.current) return;

      draftPinRef.current?.remove();

      draftPinRef.current = new mapboxgl.Marker({ color: "#9ca3af" })
        .setLngLat(e.lngLat)
        .addTo(map);

      setShowStatusPicker(true);
    });

    mapRef.current = map;

    return () => {
      watchIdRef.current &&
        navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
    };
  }, []);

  /* ---------------- GPS ---------------- */
  const enableGPS = () => {
    if (gpsStartedRef.current) return;
    gpsStartedRef.current = true;
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;
        const lngLat = [longitude, latitude];

        /* ME DOT */
        mapRef.current?.getSource("me")?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: lngLat },
              properties: { accuracy: Math.max(accuracy / 2, 20) },
            },
          ],
        });

        /* ROUTE MEMORY */
        routeCoordsRef.current.push(lngLat);

        // cap to prevent runaway size
        if (routeCoordsRef.current.length > 5000) {
          routeCoordsRef.current.shift();
        }

        mapRef.current?.getSource("route")?.setData({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: routeCoordsRef.current,
          },
        });

        /* SAVE TO LOCAL STORAGE */
        localStorage.setItem(
          "route-memory",
          JSON.stringify({
            date: todayKey(),
            coords: routeCoordsRef.current,
          })
        );

        /* FOLLOW */
        if (!followRef.current) return;

        mapRef.current.stop();
        mapRef.current.easeTo({
          center: lngLat,
          zoom: 18,
          duration: 500,
        });
      },
      () => {
        gpsStartedRef.current = false;
        setGpsEnabled(false);
        alert("GPS permission denied");
      },
      { enableHighAccuracy: true }
    );
  };

  /* AUTO GPS */
  useEffect(() => {
    if ("geolocation" in navigator) enableGPS();
  }, []);

  /* ---------------- FOLLOW ---------------- */
  const toggleFollow = () => {
    followRef.current = !followRef.current;
    setFollow(followRef.current);
    if (!followRef.current) mapRef.current?.stop();
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

      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link href="/" style={pillBtn}>Home</Link>
      </div>

      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        {!gpsEnabled && (
          <button style={pillBtn} onClick={enableGPS}>GPS</button>
        )}
        {gpsEnabled && (
          <button style={pillBtn} onClick={toggleFollow}>
            {follow ? "Lock" : "Free"}
          </button>
        )}
      </div>

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
          <button style={pillBtn} onClick={cancelLogHouse}>Cancel</button>
        )}
      </div>

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

/* -------- PILL BUTTON -------- */
const pillBtn = {
  padding: "6px 12px",
  fontSize: 13,
  borderRadius: 999,
  background: "rgba(255,255,255,0.9)",
  border: "none",
  fontWeight: 600,
};
