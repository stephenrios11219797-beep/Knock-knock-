"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);
  const followRef = useRef(true);
  const lastCoordsRef = useRef(null);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);

  // INIT MAP
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current.on("load", () => {
      mapRef.current.addSource("user-location", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      mapRef.current.addSource("logged-houses", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      mapRef.current.addLayer({
        id: "accuracy",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": ["get", "accuracy"],
          "circle-color": "#2563eb",
          "circle-opacity": 0.2,
        },
      });

      mapRef.current.addLayer({
        id: "dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
        },
      });

      mapRef.current.addLayer({
        id: "houses",
        type: "circle",
        source: "logged-houses",
        paint: {
          "circle-radius": 7,
          "circle-color": "#16a34a",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Drag disables follow
      mapRef.current.on("dragstart", () => {
        followRef.current = false;
        setFollow(false);
      });
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      mapRef.current?.remove();
    };
  }, []);

  // ENABLE GPS
  const enableGPS = () => {
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;

        lastCoordsRef.current = [longitude, latitude];

        mapRef.current.getSource("user-location")?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
              },
              properties: {
                accuracy: Math.max(accuracy / 2, 20),
              },
            },
          ],
        });

        if (followRef.current) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
          });
        }
      },
      () => alert("GPS permission denied"),
      { enableHighAccuracy: true }
    );
  };

  // LOG HOUSE (GPS POSITION)
  const logHouse = () => {
    if (!lastCoordsRef.current) {
      alert("GPS not ready yet");
      return;
    }

    const source = mapRef.current.getSource("logged-houses");
    const data = source._data;

    data.features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: lastCoordsRef.current,
      },
      properties: {},
    });

    source.setData(data);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* TOP LEFT — HOME */}
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          left: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <Link
          href="/"
          style={{
            pointerEvents: "auto",
            margin: 12,
            padding: "8px 12px",
            background: "white",
            borderRadius: 8,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Home
        </Link>
      </div>

      {/* TOP RIGHT — GPS / FOLLOW */}
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          right: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            margin: 12,
            pointerEvents: "auto",
          }}
        >
          {!gpsEnabled && <button onClick={enableGPS}>GPS</button>}
          {gpsEnabled && (
            <button
              onClick={() => {
                followRef.current = !follow;
                setFollow(!follow);
              }}
            >
              {follow ? "Following" : "Free Look"}
            </button>
          )}
        </div>
      </div>

      {/* FLOATING LOG HOUSE BUTTON */}
      <button
        onClick={logHouse}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          padding: "14px 18px",
          borderRadius: 999,
          background: "#16a34a",
          color: "white",
          fontWeight: 700,
          border: "none",
        }}
      >
        + Log House
      </button>
    </div>
  );
}
