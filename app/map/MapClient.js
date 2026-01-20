'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function MapClient() {
  const mapContainerRef = useRef(null)

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-77.0369, 38.9072], // DC for now
      zoom: 12,
    })

    return () => map.remove()
  }, [])

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  )
}
