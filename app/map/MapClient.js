
"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MainNav from "../../components/MainNav";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);

  const [isFollowing, setIsFollowing] = useState(true);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-97.7431, 30.2672], // fallback
      zoom: 15,
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // GPS REQUEST (button press)
  function requestGPS() {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device");
      return;
    }

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lngLat = [longitude, latitude];

        // Create dot if missing
        if (!userMarkerRef.current) {
          const dot = document.createElement("div");
          dot.style.width = "12px";
          dot.style.height = "12px";
          dot.style.borderRadius = "50%";
          dot.style.backgroundColor = "#2563eb";
          dot.style.boxShadow = "0 0 8px rgba(37,99,235,0.6)";

          userMarkerRef.current = new mapboxgl.Marker(dot)
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }

        // ONLY recenter if following is ON
        if (isFollowing === true) {
          mapRef.current.flyTo({
            center: lngLat,
            zoom: 17,
            essential: true,
          });
        }
      },
      () => {
        alert("Location permission denied");
      },
      {
        enableHighAccuracy: true,
      }
    );
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
          top: "56px", // leaves space for nav
          bottom: 0,
          width: "100%",
        }}
      />

      {/* FLOATING LOG HOUSE BUTTON */}
      <button
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "14px 16px",
          borderRadius: "50%",
          backgroundColor: "#2563eb",
          color: "#fff",
          fontSize: "18px",
          fontWeight: "600",
          border: "none",
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          zIndex: 1000,
        }}
        onClick={() => alert("Log house flow coming next")}
      >
        +
      </button>
    </>
  );
}
