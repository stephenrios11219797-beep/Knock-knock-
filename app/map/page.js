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

  const [mapReady, setMapReady] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);

  // Initialize map ONCE
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283], // USA center fallback
      zoom: 4,
    });

    mapRef.current.on("load", () => {
      // User location source
      mapRef.current.addSource("user-location", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Accuracy ring
      mapRef.current.addLayer({
        id: "accuracy-ring",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": ["get", "accuracy"],
          "circle-color": "#2563eb",
          "circle-opacity": 0.2,
        },
      });

      // User dot
      mapRef.current.addLayer({
        id: "user-dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
        },
      });

      setMapReady(true);
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      mapRef.current?.remove();
    };
  }, []);

  // Enable GPS (Safari-safe: user initiated)
  const enableGPS = () => {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device.");
      return;
    }

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
            accuracy: Math.max(accuracy / 2, 20), // meters → pixels-ish
          },
        };

        const source = mapRef.current.getSource("user-location");
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: [feature],
          });
        }

        if (follow) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
            duration: 500,
          });
        }
      },
      (err) => {
        alert("GPS permission denied or unavailable.");
        console.error(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      {/* MAP */}
      <div
        ref={mapContainerRef}
        style={{ height: "100%", width: "100%" }}
      />

      {/* TOP LEFT: BACK */}
      <Link
        href="/"
        style={{
          position: "absolute",
          top: "env(safe-area-inset-top)",
          left: 12,
          marginTop: 12,
          padding: "8px 12px",
          background: "white",
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: "none",
          zIndex: 10,
        }}
      >
        ← Home
      </Link>

      {/* TOP RIGHT: GPS / FOLLOW */}
      <div
        style={{
          position: "absolute",
          top: "env(safe-area-inset-top)",
          right: 12,
          marginTop: 12,
          display: "flex",
          gap: 8,
          zIndex: 10,
        }}
      >
        {!gpsEnabled && (
          <button
            onClick={enableGPS}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontWeight: 600,
            }}
          >
            Enable GPS
          </button>
        )}

        {gpsEnabled && (
          <button
            onClick={() => setFollow(!follow)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: follow ? "#16a34a" : "#9ca3af",
              color: "white",
              fontWeight: 600,
            }}
          >
            {follow ? "Following" : "Free Look"}
          </button>
        )}
      </div>
    </div>
  );
}
