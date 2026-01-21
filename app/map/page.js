"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_COLORS = {
  none: "#6b7280",
  walked: "#16a34a",
  no_answer: "#dc2626",
  soft_set: "#facc15",
  contingency: "#7c3aed",
  contract: "#f59e0b",
};

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);
  const pinRef = useRef(null);
  const followRef = useRef(true);
  const loggingRef = useRef(false);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [status, setStatus] = useState("none");

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
          "circle-color": "#2563eb",
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
    });

    map.on("dragstart", () => {
      followRef.current = false;
      setFollow(false);
    });

    map.on("click", (e) => {
      if (!loggingRef.current) return;

      if (pinRef.current) pinRef.current.remove();

      // 🔑 TEARDROP PIN (HTML)
      const el = document.createElement("div");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.background = STATUS_COLORS.none;
      el.style.borderRadius = "50% 50% 50% 0";
      el.style.transform = "rotate(-45deg)";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 6px rgba(0,0,0,0.4)";

      pinRef.current = new mapboxgl.Marker(el)
        .setLngLat(e.lngLat)
        .addTo(map);

      setHasPin(true);
      setStatus("none");
    });

    return () => map.remove();
  }, []);

  /* ---------- GPS ---------- */
  const enableGPS = () => {
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;

        mapRef.current.getSource("user-location")?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
              },
              properties: {
                accuracy: Math.max(accuracy / 2, 20),
              },
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
      () => alert("GPS permission denied"),
      { enableHighAccuracy: true }
    );
  };

  /* ---------- FOLLOW ---------- */
  const toggleFollow = () => {
    followRef.current = !followRef.current;
    setFollow(followRef.current);
  };

  /* ---------- LOG HOUSE ---------- */
  const toggleLogHouse = () => {
    const next = !isLogging;
    setIsLogging(next);
    loggingRef.current = next;

    if (!next && pinRef.current) {
      pinRef.current.remove();
      pinRef.current = null;
      setHasPin(false);
    }
  };

  /* ---------- STATUS ---------- */
  const selectStatus = (value) => {
    setStatus(value);
    if (pinRef.current) {
      pinRef.current.getElement().style.background =
        STATUS_COLORS[value];
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME */}
      <div style={{ position: "fixed", top: "env(safe-area-inset-top)", left: 0, zIndex: 50 }}>
        <Link href="/" style={pill}>← Home</Link>
      </div>

      {/* GPS / FOLLOW */}
      <div style={{ position: "fixed", top: "env(safe-area-inset-top)", right: 0, zIndex: 50 }}>
        {!gpsEnabled && <button style={pill} onClick={enableGPS}>GPS</button>}
        {gpsEnabled && <button style={pill} onClick={toggleFollow}>{follow ? "Following" : "Free Look"}</button>}
      </div>

      {/* LOG HOUSE */}
      <button
        onClick={toggleLogHouse}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          padding: "14px 18px",
          borderRadius: 999,
          background: isLogging ? "#dc2626" : "#2563eb",
          color: "white",
          fontWeight: 600,
        }}
      >
        {isLogging ? "Cancel Log" : "Log House"}
      </button>

      {/* STATUS SELECTOR */}
      {isLogging && hasPin && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            background: "white",
            borderRadius: 12,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            zIndex: 50,
          }}
        >
          {Object.keys(STATUS_COLORS).map((key) => (
            <button
              key={key}
              onClick={() => selectStatus(key)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                background: STATUS_COLORS[key],
                color: "white",
                fontWeight: 600,
              }}
            >
              {key.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const pill = {
  margin: 12,
  padding: "8px 12px",
  background: "white",
  borderRadius: 999,
  fontWeight: 600,
  textDecoration: "none",
};
