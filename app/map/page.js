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
  const loggingRef = useRef(false);

  const userPosRef = useRef(null);
  const lastLogRef = useRef(null);

  const [follow, setFollow] = useState(true);
  const [showStatus, setShowStatus] = useState(false);
  const [showSeverity, setShowSeverity] = useState(false);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");

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

      // Accuracy ring (Apple-tight)
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

      // Blue dot
      map.addLayer({
        id: "dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 8,
          "circle-color": "#2563eb",
        },
      });
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
        const { longitude, latitude } = pos.coords;
        userPosRef.current = { lng: longitude, lat: latitude };

        mapRef.current?.getSource("user-location")?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [longitude, latitude] },
            },
          ],
        });

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

  const armLogHouse = () => {
    if (!userPosRef.current) return;
    loggingRef.current = true;
    setShowStatus(true);
  };

  const savePin = (status) => {
    const lngLat = userPosRef.current;

    const marker = new mapboxgl.Marker({
      element: createPin(status.color),
    })
      .setLngLat(lngLat)
      .addTo(mapRef.current);

    const log = {
      lngLat,
      color: status.color,
      status: status.label,
      time: Date.now(),
    };

    savePinToStorage(log);
    lastLogRef.current = log;

    if (status.label === "No Answer") {
      setShowSeverity(true);
    }

    loggingRef.current = false;
    setShowStatus(false);
  };

  const saveSeverity = () => {
    lastLogRef.current.severity = severity;
    lastLogRef.current.notes = notes || null;
    setSeverity(5);
    setNotes("");
    setShowSeverity(false);
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
          style={{ borderRadius: 999, padding: "12px 18px" }}
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
            bottom: 130,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 22,
            borderRadius: 18,
            width: 320,
            zIndex: 200,
          }}
        >
          <div style={{ marginBottom: 10 }}>Roof Damage Severity</div>

          <input
            type="range"
            min={0}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            style={{ width: "100%" }}
          />

          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ marginTop: 12, width: "100%", height: 80 }}
          />

          <button onClick={saveSeverity} style={{ marginTop: 12 }}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}
