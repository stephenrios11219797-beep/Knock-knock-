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

  // -------------------------------
  // INIT MAP
  // -------------------------------
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-97.7431, 30.2672],
      zoom: 15,
    });

    // Dragging disables follow (FREE LOOK FIX)
    map.on("dragstart", () => {
      setIsFollowing(false);
    });

    mapRef.current = map;
  }, []);

  // -------------------------------
  // GPS WATCH (REAL FOLLOW MODE)
  // -------------------------------
  function requestGPS() {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device");
      return;
    }

    // Prevent duplicate watchers
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lngLat = [longitude, latitude];

        // Create or move user dot
        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            color: "#2563eb",
          })
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }

        // ONLY recenter when following
        if (isFollowing) {
          mapRef.current.easeTo({
            center: lngLat,
            zoom: 17,
            duration: 500,
          });
        }
      },
      () => {
        alert("Location permission denied");
      },
      { enableHighAccuracy: true }
    );
  }

  function toggleFollow() {
    setIsFollowing((prev) => !prev);
  }

  // Cleanup GPS watcher
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // -------------------------------
  // LOG HOUSE ACTION (PLACEHOLDER)
  // -------------------------------
  function logHouse() {
    alert("Log House (next step: capture GPS + form)");
  }

  return (
    <>
      <MainNav
        onRequestGPS={requestGPS}
        isFollowing={isFollowing}
        onToggleFollow={toggleFollow}
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
          bottom: "90px", // ABOVE Safari URL bar
          right: "16px",
          padding: "14px 16px",
          borderRadius: "999px",
          border: "none",
          background: "#2563eb",
          color: "#fff",
          fontSize: "15px",
          fontWeight: "600",
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          zIndex: 1001,
        }}
      >
        + Log House
      </button>
    </>
  );
}
