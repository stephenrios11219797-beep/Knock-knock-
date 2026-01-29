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

/* ---------- GEOCODE ---------- */
async function reverseGeocode(lng, lat) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
  );
  const data = await res.json();
  return data.features?.[0]?.place_name || "Unknown address";
}

/* ---------- PIN ---------- */
function createPin(color, onClick) {
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.innerHTML = `
    <svg width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"
        fill="${color}" />
      <circle cx="12" cy="12" r="4" fill="white" />
    </svg>
  `;
  el.style.transform = "translate(-50%, -100%)";
  el.onclick = onClick;
  return el;
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const pendingPinRef = useRef(null);
  const lastLogRef = useRef(null);

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

    map.on("click", (e) => {
      if (!showStatus) return;

      pendingPinRef.current?.remove();

      pendingPinRef.current = new mapboxgl.Marker({
        element: createPin("#9ca3af"),
      })
        .setLngLat(e.lngLat)
        .addTo(map);

      setShowStatus(true);
    });

    renderPins();
  }, []);

  /* ---------- PIN RENDER ---------- */
  const renderPins = () => {
    const all = loadAllPins()[todayKey()] || [];
    all.forEach((p) => {
      new mapboxgl.Marker({
        element: createPin(p.color, () => setSelectedPin(p)),
      })
        .setLngLat(p.lngLat)
        .addTo(mapRef.current);
    });
  };

  /* ---------- LOG ---------- */
  const armLogHouse = () => {
    setShowStatus(true);
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

    lastLogRef.current = log;

    if (status.label === "No Answer") {
      setShowSeverity(true);
    } else {
      savePinToStorage(log);
      renderPins();
    }

    setShowStatus(false);
  };

  const saveSeverity = () => {
    lastLogRef.current.severity = severity;
    lastLogRef.current.notes = notes || null;

    savePinToStorage(lastLogRef.current);
    renderPins();

    setSeverity(5);
    setNotes("");
    setShowSeverity(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div ref={mapContainerRef} style={{ height: "100%" }} />

      {/* HOME */}
      <Link
        href="/"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          background: "white",
          padding: 8,
          borderRadius: 999,
          zIndex: 50,
        }}
      >
        ← Home
      </Link>

      {/* LOG HOUSE */}
      <button
        onClick={armLogHouse}
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 18px",
          borderRadius: 999,
          zIndex: 50,
        }}
      >
        Log House
      </button>

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
        </div>
      )}

      {/* SEVERITY */}
      {showSeverity && (
        <div
          style={{
            position: "fixed",
            bottom: 140,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 20,
            borderRadius: 16,
            width: 320,
            zIndex: 200,
          }}
        >
          <strong>Roof Damage Severity</strong>

          <input
            type="range"
            min={0}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(+e.target.value)}
            style={{ width: "100%", marginTop: 12 }}
          />

          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ width: "100%", height: 80, marginTop: 10 }}
          />

          <button onClick={saveSeverity} style={{ marginTop: 10 }}>
            Save
          </button>
        </div>
      )}

      {/* PIN DETAILS */}
      {selectedPin && (
        <div
          onClick={() => setSelectedPin(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.3)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: 20,
              borderRadius: 12,
              width: 320,
            }}
          >
            <strong>{selectedPin.status}</strong>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              {selectedPin.address}
            </div>

            {selectedPin.severity !== undefined && (
              <div style={{ marginTop: 8 }}>
                Severity: {selectedPin.severity}/10
              </div>
            )}

            {selectedPin.notes && (
              <div style={{ marginTop: 6 }}>{selectedPin.notes}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
