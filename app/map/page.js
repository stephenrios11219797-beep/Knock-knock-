"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_COLORS = {
  none: "#9ca3af",
  walked: "#22c55e",
  no_answer: "#ef4444",
  soft_set: "#eab308",
  contingency: "#a855f7",
  contract: "#f59e0b",
};

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);
  const logModeRef = useRef(false);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [logMode, setLogMode] = useState(false);
  const [pins, setPins] = useState([]);
  const [activePinId, setActivePinId] = useState(null);

  // INIT MAP (ONCE)
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current = map;

    map.on("load", () => {
      // USER LOCATION
      map.addSource("user-location", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "accuracy",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": ["get", "accuracy"],
          "circle-color": "#2563eb",
          "circle-opacity": 0.2,
        },
      });

      map.addLayer({
        id: "user-dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 6,
          "circle-color": "#2563eb",
        },
      });

      // HOUSE PINS
      map.addSource("pins", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "pins-layer",
        type: "circle",
        source: "pins",
        paint: {
          "circle-radius": 7,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // MAP CLICK (MANUAL PIN DROP)
      map.on("click", (e) => {
        if (!logModeRef.current) return;

        const id = Date.now();

        setPins((prev) => [
          ...prev,
          {
            id,
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
            status: "none",
          },
        ]);

        setActivePinId(id);
        logModeRef.current = false;
        setLogMode(false);
      });
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
    };
  }, []);

  // UPDATE PIN SOURCE
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.getSource("pins")?.setData({
      type: "FeatureCollection",
      features: pins.map((p) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.lng, p.lat],
        },
        properties: {
          color: STATUS_COLORS[p.status],
        },
      })),
    });
  }, [pins]);

  // GPS
  const enableGPS = () => {
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;

        mapRef.current
          ?.getSource("user-location")
          ?.setData({
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

        if (follow) {
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

  const setStatus = (status) => {
    setPins((prev) =>
      prev.map((p) =>
        p.id === activePinId ? { ...p, status } : p
      )
    );
    setActivePinId(null);
  };

  const activePin = pins.find((p) => p.id === activePinId);

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME */}
      <Link
        href="/"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          padding: "8px 12px",
          background: "white",
          borderRadius: 8,
          fontWeight: 600,
          zIndex: 50,
        }}
      >
        ← Home
      </Link>

      {/* GPS CONTROLS */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        {!gpsEnabled && <button onClick={enableGPS}>Enable GPS</button>}
        {gpsEnabled && (
          <button onClick={() => setFollow((f) => !f)}>
            {follow ? "Following" : "Free Look"}
          </button>
        )}
      </div>

      {/* LOG HOUSE */}
      <button
        onClick={() => {
          logModeRef.current = true;
          setLogMode(true);
        }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          padding: "14px 18px",
          borderRadius: 999,
          background: "#2563eb",
          color: "white",
          fontWeight: 600,
          zIndex: 50,
        }}
      >
        {logMode ? "Tap Map…" : "Log House"}
      </button>

      {/* STATUS SELECTOR */}
      {activePin && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 12,
            borderRadius: 12,
            display: "flex",
            gap: 8,
            zIndex: 50,
          }}
        >
          {Object.keys(STATUS_COLORS).map((key) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: STATUS_COLORS[key],
                border: "2px solid #00000020",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
