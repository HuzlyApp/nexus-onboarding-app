"use client"

import mapboxgl from "mapbox-gl"
import { useEffect, useRef } from "react"
import * as turf from "@turf/turf"

// ✅ MAPBOX TOKEN
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// ==============================
// ✅ TYPES
// ==============================
type Worker = {
  id: string
  first_name: string
  last_name: string
  lat: number
  lng: number
  job_role: string
}

type Props = {
  center: [number, number]
  workers: Worker[]
  radius: number // miles
}

// ==============================
// ✅ COMPONENT
// ==============================
export default function MapBoxAdvanced({
  center,
  workers,
  radius,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center,
      zoom: 10,
    })

    map.on("load", () => {
      // =============================
      // ✅ RADIUS CIRCLE
      // =============================
      const circle = turf.circle(center, radius, {
        steps: 64,
        units: "miles",
      })

      map.addSource("radius", {
        type: "geojson",
        data: circle,
      })

      map.addLayer({
        id: "radius-fill",
        type: "fill",
        source: "radius",
        paint: {
          "fill-color": "#0CC8B0",
          "fill-opacity": 0.15,
        },
      })

      map.addLayer({
        id: "radius-outline",
        type: "line",
        source: "radius",
        paint: {
          "line-color": "#0CC8B0",
          "line-width": 2,
        },
      })

      // =============================
      // ✅ WORKERS GEOJSON
      // =============================
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: workers.map((w) => ({
          type: "Feature",
          properties: {
            id: w.id,
            name: `${w.first_name} ${w.last_name}`,
            role: w.job_role,
          },
          geometry: {
            type: "Point",
            coordinates: [w.lng, w.lat],
          },
        })),
      }

      // =============================
      // ✅ SOURCE WITH CLUSTER
      // =============================
      map.addSource("workers", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

      // =============================
      // ✅ CLUSTER LAYER
      // =============================
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "workers",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0CC8B0",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            20,
            10,
            25,
            30,
            30,
          ],
        },
      })

      // =============================
      // ✅ CLUSTER COUNT
      // =============================
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "workers",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
      })

      // =============================
      // ✅ SINGLE POINTS
      // =============================
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "workers",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#0AAE9E",
          "circle-radius": 8,
        },
      })

      // =============================
      // ✅ POPUP (CLICK MARKER)
      // =============================
      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0]
        if (!feature) return

        const geometry = feature.geometry as GeoJSON.Point
        const coords = geometry.coordinates as [number, number]

        const props = feature.properties as {
          name: string
          role: string
        }

        new mapboxgl.Popup()
          .setLngLat(coords)
          .setHTML(`
            <div style="font-size:14px">
              <strong>${props.name}</strong><br/>
              ${props.role}
            </div>
          `)
          .addTo(map)
      })

      // =============================
      // ✅ CLUSTER CLICK (ZOOM)
      // =============================
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        })

        if (!features.length) return

        const feature = features[0]

        const clusterId = feature.properties?.cluster_id as number

        const source = map.getSource("workers") as mapboxgl.GeoJSONSource

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === undefined) return

          const geometry = feature.geometry as GeoJSON.Point
          const coordinates = geometry.coordinates as [number, number]

          map.easeTo({
            center: coordinates,
            zoom: 10,
          })
        })
      })

      // =============================
      // ✅ CURSOR POINTER
      // =============================
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer"
      })

      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = ""
      })
    })

    return () => map.remove()
  }, [center, workers, radius])

  return <div ref={mapRef} className="w-full h-full rounded-xl" />
}