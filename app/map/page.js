'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import ActionPanel from './ActionPanel';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapClient() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [pins, setPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-97.7431, 30.2672],
      zoom: 15,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl());
  }, []);

  // Render pins
  useEffect(() => {
    if (!mapRef.current) return;

    pins.forEach((pin) => {
      if (pin.marker) return;

      const el = document.createElement('div');
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#2563eb';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        setSelectedPin(pin);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .addTo(mapRef.current);

      pin.marker = marker;
    });
  }, [pins]);

  return (
    <>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} />

      <ActionPanel
        selectedPin={selectedPin}
        clearSelectedPin={() => setSelectedPin(null)}
      />
    </>
  );
}
