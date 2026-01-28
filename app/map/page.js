"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const STATUS_OPTIONS = [
  { label: "Walked", color: "#16a34a" },
  { label: "No Answer", color: "#dc2626" },
  { label: "Soft Set", color: "#2563eb" },
  { label: "Contingency", color: "#7c3aed" },
  { label: "Contract", color: "#d4af37" },
  { label: "Not Interested", color: "#374151" },
];

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const followRef = useRef(true);
  const trailRecordingRef = useRef(false);
  const trailCoordsRef = useRef([]);

  const pendingPinRef = useRef(null);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [trailRecording, setTrailRecording] = useState(false);
  const [loggingMode, setLoggingMode] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

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
      mapRef.current.addSource("route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      });

      mapRef.current.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#2563eb",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
    });

    mapRef.current.on("click", (e) => {
      if (!loggingMode) return;

      if (pendingPinRef.current) {
        pendingPinRef.current.remove();
      }

      pendingPinRef.current = new mapboxgl.Marker({
        color: "#9ca3af",
      })
        .setLngLat(e.lngLat)
        .addTo(mapRef.current);

      setShowStatus(true);
    });

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      mapRef.current?.remove();
    };
  }, [loggingMode]);

  // AUTO GPS
  useEffect(() => {
    enableGPS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enableGPS = () => {
    if (gpsEnabled) return;
    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;

        if (followRef.current) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
          });
        }

        if (trailRecordingRef.current) {
          trailCoordsRef.current.push([longitude, latitude]);
          mapRef.current.getSource("route")?.setData({
            type: "Feature",
            geometry: { type: "LineString", coordinates: trailCoordsRef.current },
          });
        }
      },
      () => alert("GPS permission denied"),
      { enableHighAccuracy: true }
    );
  };

  const toggleFollow = () => {
    followRef.current = !followRef.current;
    setFollow(followRef.current);
  };

  const toggleTrailRecording = () => {
    const next = !trailRecordingRef.current;
    trailRecordingRef.current = next;
    setTrailRecording(next);

    if (next) {
      trailCoordsRef.current = [];
      mapRef.current.getSource("route")?.setData({
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
      });
    }
  };

  const savePin = (color) => {
    if (!pendingPinRef.current) return;

    pendingPinRef.current.getElement().style.backgroundColor = color;

    pendingPinRef.current = null;
    setShowStatus(false);
    setLoggingMode(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME */}
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link
          href="/"
          style={{
            padding: "8px 12px",
            background: "white",
            borderRadius: 999,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Home
        </Link>
      </div>

      {/* RIGHT CONTROLS */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={toggleFollow}>
            {follow ? "Following" : "Free Look"}
          </button>

          <button onClick={toggleTrailRecording}>
            {trailRecording ? "Trail On" : "Trail Off"}
          </button>

          <button
            onClick={() => setLoggingMode(true)}
            style={{
              background: loggingMode ? "#16a34a" : "white",
            }}
          >
            Log House
          </button>
        </div>
      </div>

      {/* STATUS SELECTOR */}
      {showStatus && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: 12,
            borderRadius: 12,
            display: "flex",
            gap: 8,
            zIndex: 100,
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => savePin(s.color)}
              style={{
                background: s.color,
                color: "white",
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
