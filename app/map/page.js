"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import ActionPanel from "./ActionPanel";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const followRef = useRef(true);
  const hasCenteredRef = useRef(false);
  const [follow, setFollow] = useState(true);

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
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Accuracy ring — ALWAYS visible
      map.addLayer({
        id: "accuracy-ring",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": [
            "coalesce",
            ["get", "accuracy"],
            30,
          ],
          "circle-color": "#3b82f6",
          "circle-opacity": 0.25,
        },
      });

      // Blue dot
      map.addLayer({
        id: "user-dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
        },
      });
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
    };
  }, []);

  /* ---------- GPS ---------- */
  useEffect(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;
        const map = mapRef.current;
        if (!map) return;

        map.getSource("user-location")?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
              },
              properties: {
                accuracy: Math.max(accuracy, 25), // 👈 never 0
              },
            },
          ],
        });

        // Always center first fix
        if (!hasCenteredRef.current) {
          map.easeTo({
            center: [longitude, latitude],
            zoom: 18,
            duration: 0,
          });
          hasCenteredRef.current = true;
          return;
        }

        // Follow afterwards
        if (followRef.current) {
          map.easeTo({
            center: [longitude, latitude],
            zoom: map.getZoom(),
            duration: 500,
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

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link
          href="/"
          style={{ padding: 8, background: "white", borderRadius: 999 }}
        >
          ← Home
        </Link>
      </div>

      {/* FOLLOW */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        <button onClick={toggleFollow}>
          {follow ? "Following" : "Free Look"}
        </button>
      </div>

      {/* ACTION PANEL */}
      <ActionPanel />
    </div>
  );
}
