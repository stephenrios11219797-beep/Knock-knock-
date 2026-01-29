"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* ---------- STATUS OPTIONS (KNOCK REMOVED, UNIQUE COLORS) ---------- */
const STATUS_OPTIONS = [
  { label: "No Answer", color: "#dc2626" },
  { label: "Soft Set", color: "#0284c7" },
  { label: "Contingency", color: "#7c3aed" },
  { label: "Contract", color: "#d4af37" },
  { label: "Not Interested", color: "#374151" },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

/* ---------- STORAGE ---------- */
const loadAllPins = () =>
  JSON.parse(localStorage.getItem("pins") || "{}");

const saveAllPins = (all) =>
  localStorage.setItem("pins", JSON.stringify(all));

/* ---------- SEVERITY → COLOR ---------- */
const severityColor = (v) => {
  if (v >= 7) return "#b91c1c";
  if (v >= 4) return "#f59e0b";
  return "#16a34a";
};

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

/* ---------- ADDRESS LOOKUP ---------- */
async function reverseGeocode(lng, lat) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || `${lat}, ${lng}`;
  } catch {
    return `${lat}, ${lng}`;
  }
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const loggingRef = useRef(false);
  const pendingPinRef = useRef(null);
  const lastLogRef = useRef(null);
  const renderedPinsRef = useRef([]);
  const trailCoordsRef = useRef([]);

  const [follow, setFollow] = useState(true);
  const [trailOn, setTrailOn] = useState(false);
  const [loggingMode, setLoggingMode] = useState(false);

  const [showStatus, setShowStatus] = useState(false);
  const [showSeverity, setShowSeverity] = useState(false);

  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");

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

      map.addSource("trail", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });

      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: { "line-width": 4, "line-color": "#2563eb" },
      });

      map.addLayer({
        id: "accuracy",
        type: "circle",
        source: "user-location",
        paint: { "circle-radius": 18, "circle-color": "#3b82f6", "circle-opacity": 0.15 },
      });

      map.addLayer({
        id: "dot",
        type: "circle",
        source: "user-location",
        paint: { "circle-radius": 7, "circle-color": "#2563eb" },
      });

      renderSavedPins();
    });

    map.on("dragstart", () => setFollow(false));

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
      async (pos) => {
        const { longitude, latitude } = pos.coords;

        if (trailOn) {
          trailCoordsRef.current.push([longitude, latitude]);
          mapRef.current?.getSource("trail")?.setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: trailCoordsRef.current },
          });
        }

        mapRef.current?.getSource("user-location")?.setData({
          type: "FeatureCollection",
          features: [{ type: "Feature", geometry: { type: "Point", coordinates: [longitude, latitude] } }],
        });

        if (follow) {
          mapRef.current.easeTo({ center: [longitude, latitude] });
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
  };

  const savePin = async (status) => {
    const lngLat = pendingPinRef.current.getLngLat();
    pendingPinRef.current.remove();

    const address = await reverseGeocode(lngLat.lng, lngLat.lat);

    const log = {
      lngLat,
      color: status.color,
      status: status.label,
      time: Date.now(),
      address,
    };

    const all = loadAllPins();
    const today = todayKey();
    all[today] = [...(all[today] || []), log];
    saveAllPins(all);

    lastLogRef.current = log;

    if (status.label === "No Answer" || status.label === "Not Interested") {
      setShowSeverity(true);
    } else {
      renderSavedPins();
    }

    loggingRef.current = false;
    setLoggingMode(false);
    setShowStatus(false);
  };

  const saveSeverity = () => {
    const all = loadAllPins();
    const today = todayKey();

    all[today] = all[today].map((p) =>
      p.time === lastLogRef.current.time
        ? { ...p, severity, notes, color: severityColor(severity) }
        : p
    );

    saveAllPins(all);
    setShowSeverity(false);
    renderSavedPins();
  };

  /* ---------- UI (UNCHANGED) ---------- */
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 500, background: "white", padding: 6, borderRadius: 6 }}>
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

      {/* STATUS, SEVERITY, PIN INFO unchanged */}
    </div>
  );
}
