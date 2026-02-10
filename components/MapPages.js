"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";

import { STATUS_OPTIONS } from "./constants"; // Optional, or inline
import { loadAllPins, savePinToStorage, saveAllPins, todayKey } from "./Storage";
import { haversine, fetchAddress } from "./utils";
import { addPinToMap } from "./PinMarker";
import StatusControls from "./StatusControls";
import SeverityEditor from "./SeverityEditor";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const RADIUS_METERS = 4000;

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const watchIdRef = useRef(null);

  const followRef = useRef(true);
  const trailOnRef = useRef(false);
  const activeSegmentRef = useRef(null);
  const loggingRef = useRef(false);
  const pendingPinRef = useRef(null);
  const renderedPinsRef = useRef([]);
  const lastLogRef = useRef(null);
  const userPosRef = useRef(null);

  const [follow, setFollow] = useState(true);
  const [trailOn, setTrailOn] = useState(false);
  const [loggingMode, setLoggingMode] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const [showSeverity, setShowSeverity] = useState(false);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);

  /* ---------- MAP INIT ---------- */
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
      map.addSource("user-location", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "accuracy-ring",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 18,
          "circle-color": "#3b82f6",
          "circle-opacity": 0.18,
        },
      });

      map.addLayer({
        id: "user-dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 7,
          "circle-color": "#2563eb",
        },
      });

      map.addSource("trail", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "trail-line",
        type: "line",
        source: "trail",
        paint: {
          "line-color": "#2563eb",
          "line-width": 3,
        },
      });

      setTimeout(renderNearbyPins, 300);
    });

    map.on("moveend", renderNearbyPins);

    // Detect swipe/drag to disable follow
    map.on("dragstart", () => {
      if (followRef.current) {
        followRef.current = false;
        setFollow(false);
      }
    });

    map.on("click", async (e) => {
      if (!loggingRef.current) return;

      pendingPinRef.current?.remove();

      pendingPinRef.current = await addPinToMap(map, { color: "#9ca3af", lngLat: e.lngLat }, () => {});

      setShowStatus(true);
    });

    return () => {
      if (watchIdRef.current)
        navigator.geolocation.clearWatch(watchIdRef.current);
      map.remove();
    };
  }, []);

  /* ---------- GPS ---------- */
  useEffect(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        userPosRef.current = { lng: longitude, lat: latitude };

        mapRef.current?.getSource("user-location")?.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [longitude, latitude] },
              properties: {},
            },
          ],
        });

        renderNearbyPins();

        if (trailOnRef.current && activeSegmentRef.current) {
          activeSegmentRef.current.geometry.coordinates.push([
            longitude,
            latitude,
          ]);
          mapRef.current.getSource("trail").setData(
            mapRef.current.getSource("trail")._data
          );
        }

        if (followRef.current) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            zoom: 18,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  /* ---------- PIN RENDERING ---------- */
  const renderNearbyPins = async () => {
    renderedPinsRef.current.forEach((m) => m.remove());
    renderedPinsRef.current = [];

    if (!userPosRef.current || !mapRef.current) return;

    const bounds = mapRef.current.getBounds();
    const all = loadAllPins()[todayKey()] || [];

    for (const p of all) {
      const dist = haversine(userPosRef.current, {
        lng: p.lngLat.lng,
        lat: p.lngLat.lat,
      });

      if (dist <= RADIUS_METERS && bounds.contains([p.lngLat.lng, p.lngLat.lat])) {
        const marker = await addPinToMap(mapRef.current, p, handleEditPin);
        renderedPinsRef.current.push(marker);
      }
    }
  };

  /* ---------- CONTROLS ---------- */
  const toggleFollow = () => {
    followRef.current = !followRef.current;
    setFollow(followRef.current);
  };

  const toggleTrail = () => {
    const src = mapRef.current.getSource("trail");
    src.setData({ type: "FeatureCollection", features: [] });

    if (!trailOnRef.current) {
      const segment = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: [] },
      };
      src._data.features.push(segment);
      activeSegmentRef.current = segment;
    } else {
      activeSegmentRef.current = null;
    }

    trailOnRef.current = !trailOnRef.current;
    setTrailOn(trailOnRef.current);
  };

  const armLogHouse = () => {
    loggingRef.current = true;
    setLoggingMode(true);
  };

  const cancelLog = () => {
    pendingPinRef.current?.remove();
    pendingPinRef.current = null;
    loggingRef.current = false;
    setLoggingMode(false);
    setShowStatus(false);
  };

  const savePin = async (status) => {
    const lngLat = pendingPinRef.current.getLngLat();
    pendingPinRef.current.remove();

    const address = await fetchAddress(lngLat);

    const log = {
      lngLat,
      color: status.color,
      status: status.label,
      time: Date.now(),
      severity: null,
      notes: null,
      address,
    };

    savePinToStorage(log);
    lastLogRef.current = log;

    if (status.label === "No Answer") {
      setShowSeverity(true);
    }

    renderNearbyPins();

    pendingPinRef.current = null;
    loggingRef.current = false;
    setLoggingMode(false);
    setShowStatus(false);
  };

  /* ---------- EDIT PIN ---------- */
  const handleEditPin = (pin) => {
    lastLogRef.current = pin;
    setSeverity(pin.severity ?? 5);
    setNotes(pin.notes ?? "");
    setSelectedStatus(STATUS_OPTIONS.find(s => s.label === pin.status) || null);
    setShowSeverity(true);
  };

  const saveSeverity = () => {
    if (!lastLogRef.current) return;

    lastLogRef.current.severity = severity;
    lastLogRef.current.notes = notes || null;
    lastLogRef.current.status = selectedStatus?.label ?? lastLogRef.current.status;
    lastLogRef.current.color = selectedStatus?.color ?? lastLogRef.current.color;

    const all = loadAllPins();
    const today = todayKey();

    all[today] = all[today].map((p) =>
      p.time === lastLogRef.current.time ? lastLogRef.current : p
    );

    saveAllPins(all);

    setSeverity(5);
    setNotes("");
    setSelectedStatus(null);
    setShowSeverity(false);

    renderNearbyPins();
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50 }}>
        <Link href="/" style={{ padding: 8, background: "white", borderRadius: 999 }}>
          ← Home
        </Link>
      </div>

      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
        <button onClick={toggleFollow}>
          {follow ? "Following" : "Free Look"}
        </button>
        <button onClick={toggleTrail}>
          {trailOn ? "Trail On" : "Trail Off"}
        </button>
      </div>

      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
        <button onClick={armLogHouse} style={{ background: loggingMode ? "#16a34a" : "white", borderRadius: 999, padding: "12px 18px" }}>
          Log House
        </button>
      </div>

      <StatusControls
        showStatus={showStatus}
        STATUS_OPTIONS={STATUS_OPTIONS}
        onSelect={savePin}
        onCancel={cancelLog}
      />

      <SeverityEditor
        show={showSeverity}
        severity={severity}
        setSeverity={setSeverity}
        notes={notes}
        setNotes={setNotes}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        STATUS_OPTIONS={STATUS_OPTIONS}
        onSave={saveSeverity}
        onCancel={() => setShowSeverity(false)}
      />
    </div>
  );
}
