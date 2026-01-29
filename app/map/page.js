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

/* ---------- STORAGE ---------- */
const loadAllPins = () =>
  JSON.parse(localStorage.getItem("pins") || "{}");

const savePinToStorage = (pin) => {
  const all = loadAllPins();
  const today = todayKey();
  all[today] = [...(all[today] || []), pin];
  localStorage.setItem("pins", JSON.stringify(all));
};

/* ---------- PIN ---------- */
function createPin(color) {
  const el = document.createElement("div");
  el.innerHTML = `
    <svg width="24" height="36" viewBox="0 0 24 36">
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
  const trailOnRef = useRef(false);
  const activeSegmentRef = useRef(null);

  const loggingRef = useRef(false);
  const pendingPinRef = useRef(null);

  const [follow, setFollow] = useState(true);
  const [trailOn, setTrailOn] = useState(false);
  const [loggingMode, setLoggingMode] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

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
          "line-color": "#2563eb",
          "line-width": 3,
        },
      });
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

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;

        map.getSource("user-location")?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [longitude, latitude] },
              properties: { accuracy: accuracy || 20 },
            },
          ],
        });

        if (trailOnRef.current && activeSegmentRef.current) {
          activeSegmentRef.current.geometry.coordinates.push([
            longitude,
            latitude,
          ]);
          map.getSource("trail").setData(
            map.getSource("trail")._data
          );
        }

        if (followRef.current) {
          map.easeTo({
            center: [longitude, latitude],
            zoom: 18,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
    };
  }, []);

  /* ---------- CONTROLS ---------- */
  const toggleFollow = () => {
    followRef.current = !followRef.current;
    setFollow(followRef.current);
  };

  const toggleTrail = () => {
    const src = mapRef.current.getSource("trail");
    src.setData({ type: "FeatureCollection", features: [] });

    if (!trailOnRef.current) {
      const segment = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
      };
      src._data.features.push(segment);
      activeSegmentRef.current = segment;
    } else {
      activeSegmentRef.current = null;
    }

    trailOnRef.current = !trailOnRef.current;
    setTrailOn(trailOnRef.current);
  };

  /* ---------- LOG HOUSE ---------- */
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

  const savePin = (status) => {
    const lngLat = pendingPinRef.current.getLngLat();
    pendingPinRef.current.remove();

    savePinToStorage({
      lngLat,
      color: status.color,
      status: status.label,
      time: Date.now(),
    });

    pendingPinRef.current = null;
    loggingRef.current = false;
    setLoggingMode(false);
    setShowStatus(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME */}
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

      {/* STATUS */}
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
          <button onClick={cancelLog} style={{ fontSize: 12 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
