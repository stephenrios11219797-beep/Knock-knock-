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

  const followRef = useRef(true); // 🔑 critical Safari fix

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [loggingMode, setLoggingMode] = useState(false);
  const [pins, setPins] = useState([]);

  /* ================= MAP INIT ================= */
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current.on("load", () => {
      // USER LOCATION SOURCE
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

      setPins((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          lngLat: [e.lngLat.lng, e.lngLat.lat],
          status: "unlogged",
        },
      ]);

      setLoggingMode(false);
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      mapRef.current?.remove();
    };
  }, [loggingMode]);

  /* ================= GPS ================= */
  const enableGPS = () => {
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;

        const feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          properties: {
            accuracy: Math.max(accuracy / 2, 20),
          },
        };

        mapRef.current
          ?.getSource("user-location")
          ?.setData({
            type: "FeatureCollection",
            features: [feature],
          });

        // 🔑 SAFARI-SAFE FOLLOW CONTROL
        if (followRef.current === true) {
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

  /* ================= PIN COLORS ================= */
  const getColor = (status) => {
    switch (status) {
      case "walked":
        return "green";
      case "no_answer":
        return "red";
      case "soft_set":
        return "yellow";
      case "contingency":
        return "purple";
      case "contract":
        return "gold";
      default:
        return "gray";
    }
  };

  /* ================= RENDER ================= */
  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* PINS */}
      {pins.map((pin) => (
        <div
          key={pin.id}
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: getColor(pin.status),
          }}
        />
      ))}

      {/* TOP LEFT — HOME */}
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

      {/* TOP RIGHT — GPS / FOLLOW */}
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          right: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            margin: 12,
            pointerEvents: "auto",
          }}
        >
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

      {/* LOG HOUSE BUTTON */}
      <button
        onClick={() => setLoggingMode(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          padding: "14px 16px",
          borderRadius: "999px",
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
