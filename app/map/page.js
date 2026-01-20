'use client'

import Map, { NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function MapPage() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: -96,
          latitude: 37.8,
          zoom: 4
        }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
      >
        <NavigationControl position="bottom-right" />
      </Map>
    </div>
  )
}
