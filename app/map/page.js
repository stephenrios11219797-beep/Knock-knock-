'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Page() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const userMarkerRef = useRef(null);
  const accuracyRingRef = useRef(null);

  const [pins, setPins] = useState([]);
  const [logMode, setLogMode] = useState(false);

  /* ---------- MAP INIT ---------- */
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-97.7431, 30.2672],
      zoom: 16,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());

    /* ---------- GPS ---------- */
    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        const lngLat = [longitude, latitude];

        // --- Blue dot (Apple style)
        if (!userMarkerRef.current) {
          const dot = document.createElement('div');
          dot.style.width = '16px';
          dot.style.height = '16px';
          dot.style.borderRadius = '50%';
          dot.style.background = '#2563eb';
          dot.style.border = '3px solid white';
          dot.style.boxShadow = '0 0 2px rgba(0,0,0,0.4)';

          userMarkerRef.current = new mapboxgl.Marker(dot)
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }

        // --- Accuracy ring (tight, stable)
        if (accuracyRingRef.current) {
          accuracyRingRef.current.remove();
        }

        const ring = document.createElement('div');
        ring.style.width = '40px';
        ring.style.height = '40px';
        ring.style.borderRadius = '50%';
        ring.style.background = 'rgba(37,99,235,0.15)';

        accuracyRingRef.current = new mapboxgl.Marker(ring)
          .setLngLat(lngLat)
          .addTo(mapRef.current);

        // Follow user
        mapRef.current.easeTo({ center: lngLat });
      },
      () => {},
      { enableHighAccuracy: true }
    );

    /* ---------- MAP CLICK (LOG HOUSE) ---------- */
    mapRef.current.on('click', (e) => {
      if (!logMode) return;

      const newPin = {
        id: Date.now(),
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        type: 'House Logged',
        timestamp: new Date().toLocaleString(),
      };

      setPins((prev) => [...prev, newPin]);
      setLogMode(false);
    });
  }, [logMode]);

  /* ---------- RENDER PINS ---------- */
  useEffect(() => {
    if (!mapRef.current) return;

    pins.forEach((pin) => {
      if (pin.marker) return;

      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.background = '#2563eb';
      el.style.border = '2px solid white';

      pin.marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .addTo(mapRef.current);
    });
  }, [pins]);

  /* ---------- EXPOSE LOG MODE (TEMP GLOBAL) ---------- */
  useEffect(() => {
    window.enableLogHouse = () => setLogMode(true);
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
