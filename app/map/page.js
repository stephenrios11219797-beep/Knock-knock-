'use client';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapPage() {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);

  const userMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  const [followUser, setFollowUser] = useState(true);
  const [trailOn, setTrailOn] = useState(false);
  const [trailCoords, setTrailCoords] = useState([]);
  const [logging, setLogging] = useState(false);

  const [logModal, setLogModal] = useState(false);
  const [logData, setLogData] = useState({
    status: '',
    severity: 5,
    notes: '',
    lngLat: null,
    address: ''
  });

  const pinsRef = useRef([]);

  // ================= MAP INIT =================
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-97.7431, 30.2672],
      zoom: 16,
      pitch: 45
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('dragstart', () => setFollowUser(false));
    map.on('zoomstart', () => setFollowUser(false));

    map.on('load', () => {
      map.addSource('trail', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [] }
        }
      });

      map.addLayer({
        id: 'trail-layer',
        type: 'line',
        source: 'trail',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-width': 4, 'line-color': '#007AFF' }
      });
    });

    map.on('click', async (e) => {
      if (!logging) return;

      const { lng, lat } = e.lngLat;
      const address = await reverseGeocode(lng, lat);

      setLogData({
        status: '',
        severity: 5,
        notes: '',
        lngLat: [lng, lat],
        address
      });

      setLogModal(true);
      setLogging(false);
    });
  }, []);

  // ================= GPS =================
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const lngLat = [longitude, latitude];

        const map = mapRef.current;
        if (!map) return;

        if (!userMarkerRef.current) {
          const el = document.createElement('div');
          el.style.width = '14px';
          el.style.height = '14px';
          el.style.background = '#007AFF';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';

          userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat(lngLat)
            .addTo(map);
        } else {
          userMarkerRef.current.setLngLat(lngLat);
        }

        if (!accuracyCircleRef.current) {
          map.addSource('accuracy', {
            type: 'geojson',
            data: circleGeoJSON(lngLat, accuracy)
          });

          map.addLayer({
            id: 'accuracy-layer',
            type: 'fill',
            source: 'accuracy',
            paint: {
              'fill-color': '#007AFF',
              'fill-opacity': 0.15
            }
          });

          accuracyCircleRef.current = true;
        } else {
          map.getSource('accuracy').setData(
            circleGeoJSON(lngLat, accuracy)
          );
        }

        if (followUser) {
          map.easeTo({ center: lngLat });
        }

        if (trailOn) {
          setTrailCoords((prev) => {
            const updated = [...prev, lngLat];
            map.getSource('trail').setData({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: updated }
            });
            return updated;
          });
        }
      },
      console.error,
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [followUser, trailOn]);

  // ================= ACTIONS =================
  const toggleTrail = () => {
    const map = mapRef.current;
    if (!map) return;

    if (trailOn) {
      map.getSource('trail').setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] }
      });
      setTrailCoords([]);
    }
    setTrailOn(!trailOn);
  };

  const saveLog = () => {
    const pinEl = document.createElement('div');
    pinEl.style.width = '18px';
    pinEl.style.height = '18px';
    pinEl.style.borderRadius = '50%';
    pinEl.style.background = severityColor(logData.severity);

    const marker = new mapboxgl.Marker(pinEl)
      .setLngLat(logData.lngLat)
      .addTo(mapRef.current);

    marker.getElement().addEventListener('click', () => {
      new mapboxgl.Popup()
        .setLngLat(logData.lngLat)
        .setHTML(`
          <strong>${logData.address}</strong><br/>
          Status: ${logData.status}<br/>
          Severity: ${logData.severity}<br/>
          Notes: ${logData.notes || '—'}
        `)
        .addTo(mapRef.current);
    });

    pinsRef.current.push({ ...logData, marker });
    setLogModal(false);
  };

  // ================= UI =================
  return (
    <>
      <div ref={mapContainerRef} style={{ width: '100vw', height: '100vh' }} />

      <div className="controls">
        <button onClick={() => setFollowUser(!followUser)}>
          {followUser ? 'Following' : 'Free Look'}
        </button>
        <button onClick={toggleTrail}>
          {trailOn ? 'Trail ON' : 'Trail OFF'}
        </button>
        <button onClick={() => setLogging(true)}>Log House</button>
      </div>

      {logModal && (
        <div className="modal">
          <h3>{logData.address}</h3>

          <select
            value={logData.status}
            onChange={(e) =>
              setLogData({ ...logData, status: e.target.value })
            }
          >
            <option value="">Select Status</option>
            <option>No Answer</option>
            <option>Not Interested</option>
            <option>Interested</option>
          </select>

          <input
            type="range"
            min="1"
            max="10"
            value={logData.severity}
            onChange={(e) =>
              setLogData({ ...logData, severity: Number(e.target.value) })
            }
            style={{
              accentColor: severityColor(logData.severity)
            }}
          />

          <textarea
            placeholder="Notes"
            value={logData.notes}
            onChange={(e) =>
              setLogData({ ...logData, notes: e.target.value })
            }
          />

          <button onClick={saveLog}>Save</button>
          <button onClick={() => setLogModal(false)}>Cancel</button>
        </div>
      )}
    </>
  );
}

// ================= HELPERS =================
function severityColor(val) {
  if (val <= 3) return 'green';
  if (val <= 6) return 'orange';
  return 'red';
}

function reverseGeocode(lng, lat) {
  return fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
  )
    .then((r) => r.json())
    .then((d) => d.features?.[0]?.place_name || 'Unknown Address');
}

function circleGeoJSON([lng, lat], radius) {
  const points = 64;
  const coords = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * (Math.PI * 2);
    coords.push([
      lng + (radius / 111320) * Math.cos(angle),
      lat + (radius / 110540) * Math.sin(angle)
    ]);
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] }
  };
}
