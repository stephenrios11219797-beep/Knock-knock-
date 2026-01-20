"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);

  const [followUser, setFollowUser] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: 16,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (!markerRef.current) {
          markerRef.current = new mapboxgl.Marker({ color: "#2563eb" })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        } else {
          markerRef.current.setLngLat([longitude, latitude]);
        }

        if (followUser) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 16,
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
        className="absolute bottom-4 right-4 z-10 rounded bg-white px-4 py-2 text-sm font-medium shadow"
      >
        {followUser ? "Disable Follow" : "Follow Me"}
      </button>
    </div>
  );
}
