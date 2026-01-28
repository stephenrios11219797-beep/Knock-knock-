"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_OPTIONS = [
  { label: "Walked", color: "#16a34a" },
  { label: "No Answer", color: "#dc2626" },
  { label: "Soft Set", color: "#0ea5e9" },
  { label: "Contingency", color: "#7c3aed" },
  { label: "Contract", color: "#d4af37" },
  { label: "Not Interested", color: "#4b5563" },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

/* ---------- CUSTOM PIN ---------- */
function createPin(color) {
  const el = document.createElement("div");
  el.innerHTML = `
    <svg width="26" height="38" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
        fill="${color}" />
      <circle cx="12" cy="12" r="4" fill="white" />
    </svg>
  `;
  el.style.transform = "translate(-50%, -100%)";
  return el;
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const followRef = useRef(true);
  const loggingRef = useRef(false);
  const trailOnRef = useRef(false);
  const pendingPinRef = useRef(null);

  const [follow, setFollow] = useState(true);
  const [loggingMode, setLoggingMode] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [trailOn, setTrailOn] = useState(false);

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

    map.on("load", () => {
      /* USER LOCATION */
      map.addSource("user-location", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "accuracy",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": ["get", "accuracy"],
          "circle-color": "#3b82f6",
          "circle-opacity": 0.2,
        },
      });

      map.addLayer({
        id: "dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
        },
      });

      /* TRAIL */
      map.addSource("trail", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] },
        },
      });

      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: {
          "line-color": "#2563eb",
          "line-width": 3,
        },
      });

      /* RESTORE TRAIL */
      const saved = JSON.parse(localStorage.getItem("trail") || "{}");
      if (saved.date === todayKey()) {
        map.getSource("trail").setData(saved.data);
      } else {
        localStorage.removeItem("trail");
      }
    });

    map.on("click", (e) => {
      if (!loggingRef.current) return;

      pendingPinRef.current?.remove();

      pendingPinRef.current = new mapboxgl.Marker({
        element: createPin("#9ca3af"),
      })
        .setLngLat(e.lngLat)
        .addTo(map);

      setShowStatus(true);
    });

    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
    };
  }, []);

  /* ---------- GPS ---------- */
  useEffect(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;

        mapRef.current
          ?.getSource("user-location")
          ?.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
                properties: { accuracy: Math.max(accuracy / 2, 20) },
              },
            ],
          });

        if (trailOnRef.current) {
          const src = mapRef.current.getSource("trail");
          const data = src._data;
          data.geometry.coordinates.push([longitude, latitude]);
          src.setData(data);
          localStorage.setItem(
            "trail",
            JSON.stringify({ date: todayKey(), data })
          );
        }

        if (followRef.current) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  /* ---------- CONTROLS ---------- */
  const toggleFollow = () => {
    followRef.current = !followRef.current;
    setFollow(followRef.current);
  };

  const toggleTrail = () => {
    trailOnRef.current = !trailOnRef.current;
    setTrailOn(trailOnRef.current);
  };

  const armLogHouse = () => {
    loggingRef.current = true;
    setLoggingMode(true);
  };

  const cancelLog = () => {
    pendingPinRef.current?.remove();
    pendingPinRef.current = null;
    loggingRef.current = false;
    setLoggingMode(false);
    setShowStatus(false);
  };

  const savePin = (color) => {
    pendingPinRef.current?.remove();
    pendingPinRef.current = null;

    new mapboxgl.Marker({
      element: createPin(color),
    })
      .setLngLat(mapRef.current.getCenter())
      .addTo(mapRef.current);

    loggingRef.current = false;
    setLoggingMode(false);
    setShowStatus(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* TOP LEFT */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link href="/" style={{ padding: 8, background: "white", borderRadius: 999 }}>
          ← Home
        </Link>
      </div>

      {/* TOP RIGHT */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        <button onClick={toggleFollow}>
          {follow ? "Following" : "Free Look"}
        </button>
        <button onClick={toggleTrail}>
          {trailOn ? "Trail On" : "Trail Off"}
        </button>
      </div>

      {/* LOG HOUSE */}
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

      {/* STATUS SELECTOR */}
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
            display: "flex",
            gap: 8,
            zIndex: 100,
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => savePin(s.color)}
              style={{
                background: s.color,
                color: "white",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {s.label}
            </button>
          ))}
          <button onClick={cancelLog}>Cancel</button>
        </div>
      )}
    </div>
  );
}
