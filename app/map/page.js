"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);
  const followRef = useRef(true);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [loggingMode, setLoggingMode] = useState(false);
  const [pins, setPins] = useState([]);

  /* ================= MAP INIT (ONCE) ================= */
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current.on("load", () => {
      mapRef.current.addSource("user-location", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      mapRef.current.addLayer({
        id: "accuracy",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": ["get", "accuracy"],
          "circle-color": "#2563eb",
          "circle-opacity": 0.2,
        },
      });

      mapRef.current.addLayer({
        id: "dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
        },
      });
    });

    // MANUAL PIN DROP
    mapRef.current.on("click", (e) => {
      if (!loggingMode) return;

      const newPin = {
        id: Date.now() + Math.random(),
        lngLat: [e.lngLat.lng, e.lngLat.lat],
        status: "unlogged",
      };

      setPins((prev) => [...prev, newPin]);
      setLoggingMode(false);
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      mapRef.current?.remove();
    };
  }, []); // ✅ DO NOT DEPEND ON loggingMode

  /* ================= GPS ================= */
  const enableGPS = () => {
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;

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

  /* ================= PIN MARKERS ================= */
  useEffect(() => {
    if (!mapRef.current) return;

    pins.forEach((pin) => {
      if (pin.marker) return;

      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.background = "gray";

      pin.marker = new mapboxgl.Marker(el)
        .setLngLat(pin.lngLat)
        .addTo(mapRef.current);
    });
  }, [pins]);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME */}
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          left: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <Link
          href="/"
          style={{
            pointerEvents: "auto",
            margin: 12,
            padding: "8px 12px",
            background: "white",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Home
        </Link>
      </div>

      {/* GPS / FOLLOW */}
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          right: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", gap: 8, margin: 12, pointerEvents: "auto" }}>
          {!gpsEnabled && <button onClick={enableGPS}>Enable GPS</button>}
          {gpsEnabled && (
            <button
              onClick={() => {
                setFollow((prev) => {
                  followRef.current = !prev;
                  return !prev;
                });
              }}
            >
              {follow ? "Following" : "Free Look"}
            </button>
          )}
        </div>
      </div>

      {/* LOG HOUSE */}
      <button
        onClick={() => setLoggingMode(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          padding: "14px 16px",
          borderRadius: 999,
          background: "#2563eb",
          color: "white",
          fontWeight: 600,
          zIndex: 50,
        }}
      >
        Log House
      </button>
    </div>
  );
}
