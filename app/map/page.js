"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* ---------- STATUS OPTIONS ---------- */
const STATUS_OPTIONS = [
  { label: "Walk", color: "#22c55e" },
  { label: "Talk", color: "#0ea5e9" },
  { label: "Soft Set", color: "#7c3aed" },
  { label: "No Answer", color: "#dc2626" },
  { label: "Not Interested", color: "#4b5563" },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

/* ---------- STORAGE ---------- */
const loadAllPins = () =>
  JSON.parse(localStorage.getItem("pins") || "{}");

const saveAllPins = (all) =>
  localStorage.setItem("pins", JSON.stringify(all));

/* ---------- PIN ELEMENT ---------- */
function createPin(color) {
  const el = document.createElement("div");
  el.innerHTML = `
    <svg width="26" height="38" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
        fill="${color}" />
      <circle cx="12" cy="12" r="4" fill="white" />
    </svg>
  `;
  el.style.cursor = "pointer";
  el.style.transform = "translate(-50%, -100%)";
  return el;
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);
  const hasCenteredOnceRef = useRef(false);

  const loggingRef = useRef(false);
  const pendingPinRef = useRef(null);
  const renderedPinsRef = useRef([]);

  const [follow, setFollow] = useState(true);
  const [trailOn, setTrailOn] = useState(false);
  const [loggingMode, setLoggingMode] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);

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
      map.addSource("user-location", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "accuracy",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 18,
          "circle-color": "#3b82f6",
          "circle-opacity": 0.15,
        },
      });

      map.addLayer({
        id: "dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 7,
          "circle-color": "#2563eb",
        },
      });

      map.addSource("trail", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: {
          "line-width": 3,
          "line-opacity": 0.6,
        },
      });

      renderSavedPins();
    });

    map.on("mousedown", () => setFollow(false));
    map.on("touchstart", () => setFollow(false));

    map.on("click", (e) => {
      if (!loggingRef.current) {
        setSelectedPin(null);
        return;
      }

      pendingPinRef.current?.remove();

      pendingPinRef.current = new mapboxgl.Marker({
        element: createPin("#9ca3af"),
      })
        .setLngLat(e.lngLat)
        .addTo(map);

      setShowStatus(true);
    });

    return () => map.remove();
  }, []);

  /* ---------- GPS ---------- */
  useEffect(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;

        const point = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        };

        mapRef.current
          ?.getSource("user-location")
          ?.setData({
            type: "FeatureCollection",
            features: [point],
          });

        if (!hasCenteredOnceRef.current) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
          });
          hasCenteredOnceRef.current = true;
        } else if (follow) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
            duration: 500,
          });
        }

        if (trailOn) {
          const src = mapRef.current.getSource("trail");
          if (src) {
            const data = src._data;
            data.features.push(point);
            src.setData(data);
          }
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, [follow, trailOn]);

  /* ---------- RENDER PINS ---------- */
  const renderSavedPins = () => {
    renderedPinsRef.current.forEach((m) => m.remove());
    renderedPinsRef.current = [];

    const all = loadAllPins()[todayKey()] || [];

    all.forEach((p) => {
      const el = createPin(p.color);
      el.onclick = (e) => {
        e.stopPropagation();
        setSelectedPin(p);
      };

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(p.lngLat)
        .addTo(mapRef.current);

      renderedPinsRef.current.push(marker);
    });
  };

  /* ---------- ACTIONS ---------- */
  const armLogHouse = () => {
    loggingRef.current = true;
    setLoggingMode(true);
    setShowStatus(false);
    pendingPinRef.current?.remove();
  };

  const savePin = (status) => {
    const lngLat = pendingPinRef.current.getLngLat();
    pendingPinRef.current.remove();

    const log = {
      lngLat,
      status: status.label,
      color: status.color,
      time: Date.now(),
      address: `${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}`,
    };

    const all = loadAllPins();
    const today = todayKey();
    all[today] = [...(all[today] || []), log];
    saveAllPins(all);

    loggingRef.current = false;
    setLoggingMode(false);
    setShowStatus(false);

    renderSavedPins();
  };

  /* ---------- TRAIL TOGGLE RESET ---------- */
  useEffect(() => {
    if (!trailOn && mapRef.current?.getSource("trail")) {
      mapRef.current.getSource("trail").setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [trailOn]);

  /* ---------- UI ---------- */
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 500 }}>
        <Link href="/">Home</Link>
      </div>

      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 500, display: "flex", gap: 8 }}>
        <button onClick={() => setFollow(!follow)}>
          {follow ? "Following" : "Free Look"}
        </button>
        <button onClick={() => setTrailOn(!trailOn)}>
          {trailOn ? "Trail On" : "Trail Off"}
        </button>
      </div>

      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 500 }}>
        <button
          onClick={armLogHouse}
          style={{
            padding: "14px 26px",
            borderRadius: 999,
            background: loggingMode ? "#16a34a" : "white",
          }}
        >
          Log House
        </button>
      </div>

      {showStatus && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "white", padding: 20, borderRadius: 18, width: 360, zIndex: 600 }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => savePin(s)}
              style={{ width: "100%", padding: 16, marginBottom: 8, background: s.color, color: "white", borderRadius: 12 }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {selectedPin && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "white", padding: 16, borderRadius: 16, width: 340, zIndex: 800 }}>
          <strong>{selectedPin.status}</strong>
          <div>{selectedPin.address}</div>
        </div>
      )}
    </div>
  );
}
