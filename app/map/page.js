"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* ---------- STATUS OPTIONS (NO KNOCK) ---------- */
const STATUS_OPTIONS = [
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

const saveAllPins = (all) =>
  localStorage.setItem("pins", JSON.stringify(all));

/* ---------- SEVERITY → COLOR ---------- */
const severityColor = (v) => {
  if (v >= 7) return "#dc2626";
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

/* ---------- REVERSE GEOCODE ---------- */
async function reverseGeocode(lng, lat) {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || "Unknown address";
  } catch {
    return "Unknown address";
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

      renderSavedPins();
    });

    /* Disable follow ONLY on user interaction */
    map.on("mousedown", (e) => {
      if (e.originalEvent) setFollow(false);
    });
    map.on("touchstart", (e) => {
      if (e.originalEvent) setFollow(false);
    });

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
              },
            ],
          });

        if (follow) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
            duration: 500,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, [follow]);

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
        ? {
            ...p,
            severity,
            notes,
            color: severityColor(severity),
          }
        : p
    );

    saveAllPins(all);

    setSeverity(5);
    setNotes("");
    setShowSeverity(false);

    loggingRef.current = false;
    setLoggingMode(false);

    renderSavedPins();
  };

  /* ---------- UI ---------- */
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* TOP LEFT */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 500 }}>
        <Link href="/">Home</Link>
      </div>

      {/* TOP RIGHT */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 500, display: "flex", gap: 8 }}>
        <button onClick={() => setFollow(!follow)}>
          {follow ? "Following" : "Free Look"}
        </button>
        <button onClick={() => setTrailOn(!trailOn)}>
          {trailOn ? "Trail On" : "Trail Off"}
        </button>
      </div>

      {/* LOG HOUSE */}
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

      {/* STATUS */}
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

      {/* SEVERITY */}
      {showSeverity && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "white", padding: 18, borderRadius: 16, width: 340, zIndex: 700 }}>
          <div style={{ color: severityColor(severity) }}>Severity: {severity}</div>
          <input type="range" min="1" max="10" value={severity} onChange={(e) => setSeverity(+e.target.value)} />
          <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", marginTop: 8 }} />
          <button onClick={saveSeverity}>Save</button>
        </div>
      )}

      {/* PIN INFO */}
      {selectedPin && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "white", padding: 16, borderRadius: 16, width: 340, zIndex: 800 }}>
          <strong>{selectedPin.status}</strong>
          <div>{selectedPin.address}</div>
          {selectedPin.severity && <div>Severity: {selectedPin.severity}</div>}
          {selectedPin.notes && <div>Notes: {selectedPin.notes}</div>}
        </div>
      )}
    </div>
  );
}
