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

  const tempPinRef = useRef(null);
  const isLoggingRef = useRef(false);
  const followRef = useRef(true); // 🔑 SOURCE OF TRUTH

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [isLogging, setIsLogging] = useState(false);

  /* ---------- MAP INIT (ONCE) ---------- */
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

    // 🔑 USER INTERACTION = FREE LOOK
    map.on("dragstart", () => {
      followRef.current = false;
      setFollow(false);
    });

    map.on("click", (e) => {
      if (!isLoggingRef.current) return;

      if (tempPinRef.current) tempPinRef.current.remove();

      tempPinRef.current = new mapboxgl.Marker({
        color: "#6b7280", // gray (unlogged)
      })
        .setLngLat(e.lngLat)
        .addTo(map);
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

        // 🔑 ONLY CENTER IF FOLLOW IS TRUE
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

  /* ---------- FOLLOW TOGGLE ---------- */
  const toggleFollow = () => {
    const next = !followRef.current;
    followRef.current = next;
    setFollow(next);
  };

  /* ---------- LOG HOUSE ---------- */
  const toggleLogHouse = () => {
    const next = !isLogging;
    setIsLogging(next);
    isLoggingRef.current = next;

    if (!next && tempPinRef.current) {
      tempPinRef.current.remove();
      tempPinRef.current = null;
    }
  };

  /* ---------- CLEANUP ---------- */
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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
        <div
          style={{
            display: "flex",
            gap: 8,
            margin: 12,
            pointerEvents: "auto",
          }}
        >
          {!gpsEnabled && <button onClick={enableGPS}>GPS</button>}
          {gpsEnabled && (
            <button onClick={toggleFollow}>
              {follow ? "Following" : "Free Look"}
            </button>
          )}
        </div>
      </div>

      {/* LOG HOUSE */}
      <button
        onClick={toggleLogHouse}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          padding: "14px 18px",
          background: isLogging ? "#dc2626" : "#2563eb",
          color: "white",
          borderRadius: 999,
          fontWeight: 600,
          zIndex: 50,
        }}
      >
        {isLogging ? "Cancel Log" : "Log House"}
      </button>
    </div>
  );
}
