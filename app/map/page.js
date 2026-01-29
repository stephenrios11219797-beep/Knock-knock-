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

      // 🍎 Apple-tight accuracy ring
      map.addLayer({
        id: "accuracy-ring",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "accuracy"], 15],
            5, 8,
            15, 12,
            30, 18,
            60, 24,
          ],
          "circle-color": "#3b82f6",
          "circle-opacity": 0.22,
        },
      });

      // Blue dot
      map.addLayer({
        id: "user-dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 5,
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
                accuracy: Math.max(accuracy ?? 15, 15),
              },
            },
          ],
        });

        if (!hasCenteredRef.current) {
          map.easeTo({
            center: [longitude, latitude],
            zoom: 18,
            duration: 0,
          });
          hasCenteredRef.current = true;
          return;
        }

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
