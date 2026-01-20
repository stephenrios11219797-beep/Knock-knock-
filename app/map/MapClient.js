"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const watchIdRef = useRef(null);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const [error, setError] = useState("");

  // Initialize map ONCE
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283], // USA center
      zoom: 4,
    });
  }, []);

  // Start GPS ONLY after button click (Safari-safe)
  const enableGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { longitude, latitude } = position.coords;

        if (!markerRef.current) {
          markerRef.current = new mapboxgl.Marker({ color: "#007AFF" })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);
        } else {
          markerRef.current.setLngLat([longitude, latitude]);
        }

        if (followUser) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
            duration: 500,
          });
        }
      },
      () => {
        setError("GPS permission denied or unavailable");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    setGpsEnabled(true);
    setError("");
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {/* TOP CONTROL BAR */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          zIndex: 10,
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/">
          <button style={buttonStyle}>Home</button>
        </Link>

        {!gpsEnabled && (
          <button style={buttonStyle} onClick={enableGPS}>
            Enable GPS
          </button>
        )}

        {gpsEnabled && (
          <button
            style={buttonStyle}
            onClick={() => setFollowUser((prev) => !prev)}
          >
            {followUser ? "Unlock Map" : "Follow Me"}
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 10,
            zIndex: 10,
            background: "rgba(255,0,0,0.85)",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* MAP */}
      <div
        ref={mapContainerRef}
        style={{ height: "100%", width: "100%" }}
      />
    </div>
  );
}

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#111",
  color: "#fff",
  fontSize: "14px",
  cursor: "pointer",
};
