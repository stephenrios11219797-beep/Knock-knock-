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

  const trailCoordsRef = useRef([]);
  const trailRecordingRef = useRef(false);

  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [follow, setFollow] = useState(true);
  const [trailRecording, setTrailRecording] = useState(false);

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
      // USER LOCATION
      mapRef.current.addSource("user-location", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      mapRef.current.addLayer({
        id: "accuracy",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": ["get", "accuracy"],
          "circle-color": "#2563eb",
          "circle-opacity": 0.25,
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

      // TRAIL
      mapRef.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: [] },
        },
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

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      mapRef.current?.remove();
    };
  }, []);

  // AUTO-ENABLE GPS ON LOAD (FIX)
  useEffect(() => {
    enableGPS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enableGPS = () => {
    if (gpsEnabled) return;

    setGpsEnabled(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude, accuracy } = pos.coords;

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

        if (follow) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
          });
        }

        if (trailRecordingRef.current) {
          trailCoordsRef.current.push([longitude, latitude]);
          mapRef.current.getSource("route")?.setData({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: trailCoordsRef.current,
            },
          });
        }
      },
      () => alert("GPS permission denied"),
      { enableHighAccuracy: true }
    );
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

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* HOME */}
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
            borderRadius: 999,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          ← Home
        </Link>
      </div>

      {/* CONTROLS */}
      <div
        style={{
          position: "fixed",
          top: "env(safe-area-inset-top)",
          right: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", gap: 8, margin: 12, pointerEvents: "auto" }}>
          <button onClick={() => setFollow(!follow)}>
            {follow ? "Following" : "Free Look"}
          </button>

          <button onClick={toggleTrailRecording}>
            {trailRecording ? "Trail Recording" : "Trail Off"}
          </button>
        </div>
      </div>
    </div>
  );
}
