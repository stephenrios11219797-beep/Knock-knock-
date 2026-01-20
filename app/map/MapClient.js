"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [following, setFollowing] = useState(true);

  // INIT MAP
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
  }, []);

  // GPS TRACKING
  useEffect(() => {
    if (!navigator.geolocation || !mapRef.current) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const lngLat = [longitude, latitude];

        // Create marker
        if (!markerRef.current) {
          markerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          markerRef.current.setLngLat(lngLat);
        }

        // Follow mode
        if (following) {
          mapRef.current.easeTo({
            center: lngLat,
            zoom: 18,
            duration: 500,
          });
        }
      },
      (err) => {
        console.error("GPS ERROR:", err);
        alert("GPS permission denied or unavailable.");
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [following]);

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
      />

      {/* FOLLOW TOGGLE */}
      <button
        onClick={() => setFollowing(!following)}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          zIndex: 10,
          padding: "10px 14px",
          background: following ? "#2563eb" : "#6b7280",
          color: "white",
          borderRadius: 8,
          border: "none",
          fontWeight: 600,
        }}
      >
        {following ? "Following" : "Free Look"}
      </button>
    </div>
  );
}
