"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/* ---------- STATUS OPTIONS ---------- */
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

/* ---------- SEVERITY COLOR ---------- */
const severityColor = (v) => {
  if (v >= 7) return "#dc2626";
  if (v >= 4) return "#f59e0b";
  return "#16a34a";
};

/* ---------- PIN ---------- */
function createPin(color) {
  const el = document.createElement("div");
  el.innerHTML = `
    <svg width="26" height="38" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" />
      <circle cx="12" cy="12" r="4" fill="white" />
    </svg>
  `;
  el.style.transform = "translate(-50%, -100%)";
  el.style.cursor = "pointer";
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
  const trailCoordsRef = useRef([]);

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
          "line-width": 4,
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
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;

        if (trailOn) {
          trailCoordsRef.current.push([longitude, latitude]);
          mapRef.current?.getSource("trail")?.setData({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: trailCoordsRef.current,
                },
              },
            ],
          });
        }

        mapRef.current?.getSource("user-location")?.setData({
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

    return () => navigator.geolocation.clearWatch(id);
  }, [follow, trailOn]);

  /* ---------- RENDER PINS ---------- */
  const renderSavedPins = () => {
    renderedPinsRef.current.forEach((m) => m.remove());
    renderedPinsRef.current = [];

    const pins = loadAllPins()[todayKey()] || [];

    pins.forEach((p) => {
      const el = createPin(p.color);
      el.onclick = (e) => {
        e.stopPropagation();
        setSelectedPin(p);
      };

      renderedPinsRef.current.push(
        new mapboxgl.Marker({ element: el })
          .setLngLat(p.lngLat)
          .addTo(mapRef.current)
      );
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
    setSeverity(5);
    setNotes("");
    renderSavedPins();
  };

  /* ---------- UI ---------- */
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%" }} />

      <div style={{ position: "fixed", top: 12, left: 12 }}>
        <Link href="/">Home</Link>
      </div>

      <div style={{ position: "fixed", top: 12, right: 12, display: "flex", gap: 8 }}>
        <button onClick={() => setFollow(true)}>Follow</button>
        <button onClick={() => {
          setTrailOn(!trailOn);
          if (trailOn) {
            trailCoordsRef.current = [];
            mapRef.current?.getSource("trail")?.setData({
              type: "FeatureCollection",
              features: [],
            });
          }
        }}>
          {trailOn ? "Trail Off" : "Trail On"}
        </button>
      </div>

      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
        <button onClick={armLogHouse}>Log House</button>
      </div>

      {selectedPin && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "white", padding: 14, borderRadius: 14, width: 320 }}>
          <strong>{selectedPin.status}</strong>
          <div>{selectedPin.address}</div>
          {selectedPin.severity && <div>Severity: {selectedPin.severity}</div>}
          {selectedPin.notes && <div>Notes: {selectedPin.notes}</div>}
        </div>
      )}
    </div>
  );
}
