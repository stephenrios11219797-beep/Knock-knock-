"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ✅ ENV VARIABLE (LOCKED)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current.addControl(
      new mapboxgl.NavigationControl(),
      "top-right"
    );
  }, []);

  // 📍 Get GPS location
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setUserLocation([longitude, latitude]);

        // Add marker if it doesn't exist
        if (!userMarkerRef.current && mapRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            color: "#2563eb", // Blue GPS dot
          })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        }

        // Update marker position
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        }
      },
      (error) => {
        console.error("GPS error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh", // 🔒 DO NOT REMOVE
      }}
    >
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%", // 🔒 DO NOT REMOVE
        }}
      />
    </div>
  );
}
