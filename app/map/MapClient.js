"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MainNav from "../../components/MainNav";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [isFollowing, setIsFollowing] = useState(true);
  const [lastPosition, setLastPosition] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-97.7431, 30.2672],
      zoom: 15,
    });
  }, []);

  // GPS REQUEST HANDLER
  function requestGPS() {
    if (!navigator.geolocation) {
      alert("GPS not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lngLat = [longitude, latitude];

        setLastPosition(lngLat);

        // User dot
        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            color: "#2563eb",
          })
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }

        if (isFollowing) {
          mapRef.current.flyTo({
            center: lngLat,
            zoom: 17,
          });
        }
      },
      () => alert("Location permission denied"),
      { enableHighAccuracy: true }
    );
  }

  // LOG HOUSE BUTTON
  function logHouse() {
    if (!lastPosition) {
      alert("Get GPS location first");
      return;
    }

    new mapboxgl.Marker({
      color: "#16a34a", // green = logged house
    })
      .setLngLat(lastPosition)
      .addTo(mapRef.current);
  }

  return (
    <>
      <MainNav
        onRequestGPS={requestGPS}
        isFollowing={isFollowing}
        onToggleFollow={() => setIsFollowing((prev) => !prev)}
      />

      {/* MAP */}
      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "100%",
        }}
      />

      {/* FLOATING LOG HOUSE BUTTON */}
      <button
        onClick={logHouse}
        style={{
          position: "fixed",
          bottom: "80px",
          right: "16px",
          padding: "14px 16px",
          borderRadius: "999px",
          background: "#16a34a",
          color: "#fff",
          fontSize: "14px",
          fontWeight: "600",
          border: "none",
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          zIndex: 1000,
        }}
      >
        Log House
      </button>
    </>
  );
}
