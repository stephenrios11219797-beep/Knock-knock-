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
  const [userLocation, setUserLocation] = useState(null);

  /* ---------------- MAP INIT ---------------- */
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-97.7431, 30.2672], // fallback
      zoom: 15,
    });
  }, []);

  /* ---------------- GPS WATCHER ---------------- */
  function requestGPS() {
    if (!navigator.geolocation) {
      alert("GPS not supported");
      return;
    }

    if (watchIdRef.current) return; // already watching

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const lngLat = [longitude, latitude];

        setUserLocation(lngLat);

        // Create or move dot
        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            color: "#2563eb",
            scale: 0.8,
          })
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }

        // Camera control ONLY when following
        if (isFollowing) {
          mapRef.current.flyTo({
            center: lngLat,
            zoom: 17,
            speed: 1.2,
          });
        }
      },
      () => alert("Location permission denied"),
      { enableHighAccuracy: true }
    );
  }

  /* ---------------- FOLLOW TOGGLE ---------------- */
  useEffect(() => {
    if (!isFollowing || !userLocation || !mapRef.current) return;

    mapRef.current.flyTo({
      center: userLocation,
      zoom: 17,
      speed: 1.2,
    });
  }, [isFollowing, userLocation]);

  /* ---------------- CLEANUP ---------------- */
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <>
      <MainNav
        onRequestGPS={requestGPS}
        isFollowing={isFollowing}
        onToggleFollow={() => setIsFollowing((prev) => !prev)}
      />

      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          top: "56px", // below nav
          bottom: 0,
          width: "100%",
        }}
      />
    </>
  );
}
