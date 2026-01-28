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

      {/* ACTION PANEL */}
      <ActionPanel />

      {/* PIN DETAILS MODAL */}
      {selectedPin && (
        <div
          onClick={() => setSelectedPin(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 50,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 16,
              width: '90%',
              maxWidth: 320,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>House Details</strong>
              <button
                onClick={() => setSelectedPin(null)}
                style={{
                  fontSize: 16,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 14 }}>
              <div><strong>Status:</strong> {selectedPin.type}</div>
              <div><strong>Logged:</strong> {selectedPin.timestamp}</div>

              {selectedPin.severity !== undefined && (
                <div style={{ marginTop: 6 }}>
                  <strong>Severity:</strong> {selectedPin.severity}/10
                </div>
              )}

              {selectedPin.notes && (
                <div style={{ marginTop: 6 }}>
                  <strong>Notes:</strong>
                  <div style={{ fontSize: 13, marginTop: 2 }}>
                    {selectedPin.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
