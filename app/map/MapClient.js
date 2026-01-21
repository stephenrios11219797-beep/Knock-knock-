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

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-97.7431, 30.2672], // fallback (Austin)
      zoom: 15,
    });
  }, []);

  // GPS REQUEST HANDLER (BUTTON)
  function requestGPS() {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        const lngLat = [longitude, latitude];

        // Add or move user dot
        if (!userMarkerRef.current) {
          userMarkerRef.current = new mapboxgl.Marker({
            color: "#2563eb", // blue dot
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

      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "100%",
        }}
      />
    </>
  );
}
