"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ✅ ENV VARIABLE (this is the correct name)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Prevent re-initialization
    if (mapRef.current) return;

    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283], // US center
      zoom: 4,
    });

    // Optional basic controls (safe to keep)
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh", // 🔒 REQUIRED — DO NOT REMOVE
      }}
    >
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%", // 🔒 REQUIRED — DO NOT REMOVE
        }}
      />
    </div>
  );
}
