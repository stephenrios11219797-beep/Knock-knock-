'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapPage() {
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // USA
      zoom: 4
    });

    return () => map.remove();
  }, []);

  return (
    <div
      id="map"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
