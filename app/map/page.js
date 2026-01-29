"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_OPTIONS = [
  { label: "Knock", color: "#16a34a" },
  { label: "No Answer", color: "#dc2626" },
  { label: "Soft Set", color: "#0ea5e9" },
  { label: "Contingency", color: "#7c3aed" },
  { label: "Contract", color: "#d4af37" },
  { label: "Not Interested", color: "#4b5563" },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const loadAllPins = () =>
  JSON.parse(localStorage.getItem("pins") || "{}");

const saveAllPins = (all) =>
  localStorage.setItem("pins", JSON.stringify(all));

const severityColor = (v) => {
  if (v >= 7) return "#dc2626";
  if (v >= 4) return "#f59e0b";
  return "#16a34a";
};

async function reverseGeocode(lng, lat) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
  );
  const data = await res.json();
  return data.features?.[0]?.place_name || "Unknown address";
}

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
  el.style.cursor = "pointer";
  return el;
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
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

  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: 4,
      center: [-98.5795, 39.8283],
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

    map.on("click", async (e) => {
      if (!loggingMode) return;

      pendingPinRef.current?.remove();
      pendingPinRef.current = new mapboxgl.Marker({
        element: createPin("#9ca3af"),
      })
        .setLngLat(e.lngLat)
        .addTo(map);

      setShowStatus(true);
    });
  }, [loggingMode]);

  const renderSavedPins = () => {
    renderedPinsRef.current.forEach((m) => m.remove());
    renderedPinsRef.current = [];

    const all = loadAllPins()[todayKey()] || [];

    all.forEach((p) => {
      const el = createPin(p.color);
      el.onclick = () => setSelectedPin(p);

      renderedPinsRef.current.push(
        new mapboxgl.Marker({ element: el })
          .setLngLat(p.lngLat)
          .addTo(mapRef.current)
      );
    });
  };

  const savePin = async (status) => {
    const lngLat = pendingPinRef.current.getLngLat();
    pendingPinRef.current.remove();

    const address = await reverseGeocode(lngLat.lng, lngLat.lat);

    const log = {
      lngLat,
      status: status.label,
      color: status.color,
      address,
      time: Date.now(),
    };

    const all = loadAllPins();
    const today = todayKey();
    all[today] = [...(all[today] || []), log];
    saveAllPins(all);

    lastLogRef.current = log;
    setShowStatus(false);

    if (status.label === "No Answer" || status.label === "Not Interested") {
      setShowSeverity(true);
    } else {
      renderSavedPins();
    }

    setLoggingMode(false);
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
    setShowSeverity(false);
    setSeverity(5);
    setNotes("");
    renderSavedPins();
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%" }} />

      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 10 }}>
        <Link href="/">Home</Link>
      </div>

      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 10 }}>
        <button onClick={() => setFollow(!follow)}>
          {follow ? "Following" : "Free Look"}
        </button>
        <button onClick={() => setTrailOn(!trailOn)}>
          {trailOn ? "Trail On" : "Trail Off"}
        </button>
      </div>

      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
        <button onClick={() => setLoggingMode(true)}>Log House</button>
      </div>

      {showStatus && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)" }}>
          {STATUS_OPTIONS.map((s) => (
            <button key={s.label} onClick={() => savePin(s)} style={{ background: s.color }}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {showSeverity && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)" }}>
          <input
            type="range"
            min="1"
            max="10"
            value={severity}
            onChange={(e) => setSeverity(+e.target.value)}
            style={{
              width: "100%",
              accentColor: severityColor(severity),
            }}
          />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button onClick={saveSeverity}>Save</button>
        </div>
      )}

      {selectedPin && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)" }}>
          <strong>{selectedPin.status}</strong>
          <div>{selectedPin.address}</div>
          {selectedPin.severity && <div>Severity: {selectedPin.severity}</div>}
          {selectedPin.notes && <div>{selectedPin.notes}</div>}
        </div>
      )}
    </div>
  );
}
