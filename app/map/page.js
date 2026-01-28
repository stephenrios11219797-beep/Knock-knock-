"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import ActionPanel from "./ActionPanel";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
  el.style.padding = "14px";
  el.style.cursor = "pointer";
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
  const userPosRef = useRef(null);
  const renderedPinsRef = useRef([]);
  const pendingClickRef = useRef(null);

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

      setTimeout(renderNearbyPins, 300);
    });

    map.on("moveend", renderNearbyPins);

    map.on("click", (e) => {
      pendingClickRef.current = e.lngLat;
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
              properties: { accuracy: 20 },
            },
          ],
        });

        renderNearbyPins();
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  /* ---------- PIN RENDER ---------- */
  const renderNearbyPins = () => {
    renderedPinsRef.current.forEach((m) => m.remove());
    renderedPinsRef.current = [];

    if (!userPosRef.current || !mapRef.current) return;

    const bounds = mapRef.current.getBounds();
    const all = loadAllPins()[todayKey()] || [];

    all.forEach((p) => {
      const dist = haversine(userPosRef.current, p);

      if (dist <= RADIUS_METERS && bounds.contains([p.lng, p.lat])) {
        const marker = new mapboxgl.Marker({
          element: createPin(p.color),
        })
          .setLngLat([p.lng, p.lat])
          .addTo(mapRef.current);

        renderedPinsRef.current.push(marker);
      }
    });
  };

  /* ---------- SAVE FROM ACTION PANEL ---------- */
  const handleSaveLog = ({ lat, lng, color }) => {
    savePinToStorage({ lat, lng, color, time: Date.now() });
    renderNearbyPins();
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link href="/" style={{ padding: 8, background: "white", borderRadius: 999 }}>
          ← Home
        </Link>
      </div>

      <ActionPanel
        getPendingLngLat={() => pendingClickRef.current}
        onSave={handleSaveLog}
      />
    </div>
  );
}
