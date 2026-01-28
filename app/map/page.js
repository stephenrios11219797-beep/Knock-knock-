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

const RADIUS_METERS = 4000;
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

/* ---------- UTILS ---------- */
const haversine = (a, b) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
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
  const loggingRef = useRef(false);
  const pendingPinRef = useRef(null);
  const renderedPinsRef = useRef([]);

  const trailGeoRef = useRef({
    type: "FeatureCollection",
    features: [],
  });

  const [follow, setFollow] = useState(true);
  const [trailOn, setTrailOn] = useState(false);
  const [loggingMode, setLoggingMode] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const userPosRef = useRef(null);

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
          "circle-radius": 6,
          "circle-color": "#2563eb",
        },
      });

      map.addSource("trail", {
        type: "geojson",
        data: trailGeoRef.current,
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

      renderNearbyPins();
    });

    map.on("moveend", renderNearbyPins);

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
        userPosRef.current = { lng: longitude, lat: latitude };

        mapRef.current?.getSource("user-location")?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [longitude, latitude] },
              properties: { accuracy: Math.max(accuracy / 2, 20) },
            },
          ],
        });

        renderNearbyPins();

        if (trailOnRef.current) {
          const line = trailGeoRef.current.features[0];
          if (line) {
            line.geometry.coordinates.push([longitude, latitude]);
            mapRef.current
              .getSource("trail")
              .setData(trailGeoRef.current);
          }
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

  /* ---------- PIN RENDERING ---------- */
  const renderNearbyPins = () => {
    renderedPinsRef.current.forEach((m) => m.remove());
    renderedPinsRef.current = [];

    if (!userPosRef.current || !mapRef.current) return;

    const bounds = mapRef.current.getBounds();
    const all = loadAllPins()[todayKey()] || [];

    all.forEach((p) => {
      const dist = haversine(userPosRef.current, {
        lng: p.lngLat.lng,
        lat: p.lngLat.lat,
      });

      if (
        dist <= RADIUS_METERS &&
        bounds.contains([p.lngLat.lng, p.lngLat.lat])
      ) {
        const marker = new mapboxgl.Marker({
          element: createPin(p.color),
        })
          .setLngLat(p.lngLat)
          .addTo(mapRef.current);

        renderedPinsRef.current.push(marker);
      }
    });
  };

  /* ---------- CONTROLS ---------- */
  const toggleFollow = () => {
    followRef.current = !followRef.current;
    setFollow(followRef.current);
  };

  const toggleTrail = () => {
    trailOnRef.current = !trailOnRef.current;
    setTrailOn(trailOnRef.current);

    trailGeoRef.current = {
      type: "FeatureCollection",
      features: trailOnRef.current
        ? [
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: [] },
            },
          ]
        : [],
    };

    mapRef.current
      ?.getSource("trail")
      ?.setData(trailGeoRef.current);
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
    const lngLat = pendingPinRef.current.getLngLat();
    pendingPinRef.current.remove();

    savePinToStorage({ lngLat, color, time: Date.now() });
    renderNearbyPins();

    pendingPinRef.current = null;
    loggingRef.current = false;
    setLoggingMode(false);
    setShowStatus(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link href="/" style={{ padding: 8, background: "white", borderRadius: 999 }}>
          ← Home
        </Link>
      </div>

      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        <button onClick={toggleFollow}>
          {follow ? "Following" : "Free Look"}
        </button>
        <button onClick={toggleTrail}>
          {trailOn ? "Trail On" : "Trail Off"}
        </button>
      </div>

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
            maxWidth: "90vw",
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
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 11,
              }}
            >
              {s.label}
            </button>
          ))}
          <button onClick={cancelLog} style={{ fontSize: 11 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
