'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import ActionPanel from './ActionPanel';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function Page() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const userDotRef = useRef(null);
  const haloRef = useRef(null);

  const [pins, setPins] = useState([]);
  const [logMode, setLogMode] = useState(false);

  /* ---------- INIT MAP ---------- */
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
        const { latitude, longitude } = pos.coords;
        const lngLat = [longitude, latitude];

        // --- Apple-style blue dot
        if (!userDotRef.current) {
          const dot = document.createElement('div');
          dot.style.width = '14px';
          dot.style.height = '14px';
          dot.style.borderRadius = '50%';
          dot.style.background = '#007AFF'; // Apple blue
          dot.style.border = '2px solid white';
          dot.style.boxShadow = '0 0 1px rgba(0,0,0,0.4)';

          userDotRef.current = new mapboxgl.Marker(dot)
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          userDotRef.current.setLngLat(lngLat);
        }

        // --- Tight static halo (Apple-like)
        if (!haloRef.current) {
          const halo = document.createElement('div');
          halo.style.width = '28px';
          halo.style.height = '28px';
          halo.style.borderRadius = '50%';
          halo.style.background = 'rgba(0,122,255,0.18)';

          haloRef.current = new mapboxgl.Marker(halo)
            .setLngLat(lngLat)
            .addTo(mapRef.current);
        } else {
          haloRef.current.setLngLat(lngLat);
        }

        mapRef.current.easeTo({ center: lngLat });
      },
      () => {},
      { enableHighAccuracy: true }
    );

    /* ---------- MAP CLICK → LOG HOUSE ---------- */
    mapRef.current.on('click', (e) => {
      if (!logMode) return;

      const pin = {
        id: Date.now(),
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        type: 'House Logged',
        timestamp: new Date().toLocaleString(),
      };

      setPins((p) => [...p, pin]);
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

  /* ---------- EXPOSE LOG ACTION ---------- */
  useEffect(() => {
    window.logHouse = () => setLogMode(true);
  }, []);

  return (
    <>
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100vh' }}
      />
      <ActionPanel />
    </>
  );
}
