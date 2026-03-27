'use client'

import mapboxgl from 'mapbox-gl'
import { useEffect, useRef } from 'react'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function MapBoxMap({ workers }: any) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-83.0458, 42.3314],
      zoom: 10
    })

    workers?.forEach((worker: any) => {
      new mapboxgl.Marker()
        .setLngLat([worker.lng, worker.lat])
        .addTo(mapRef.current)
    })
  }, [workers])

  return (
    <div
      ref={mapContainer}
      className="w-full h-[300px] rounded-lg"
    />
  )
}