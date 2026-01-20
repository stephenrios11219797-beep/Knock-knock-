"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  const [followUser, setFollowUser] = useState(true);

  // Initialize map ONCE
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-86.1581, 39.7684], // fallback (Indianapolis)
      zoom: 16,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());
  }, []);

  // GPS tracking
  useEffect(() => {
    if (!navigator.geolocation || !mapRef.current) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude, latitude } = position.coords;

        if (followUser) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 18,
            speed: 0.8,
          });
        }
      },
      (error) => {
        console.error("GPS error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [followUser]);

  return (
    <div className="relative h-screen w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      <button
        onClick={() => setFollowUser((prev) => !prev)}
        className="absolute bottom-4 right-4 z-10 rounded bg-black px-4 py-2 text-white shadow"
      >
        {followUser ? "Disable Follow" : "Follow Me"}
      </button>
    </div>
  );
}
