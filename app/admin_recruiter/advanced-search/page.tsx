"use client"

import { useEffect, useState } from "react"
import MapBoxAdvanced from "@/app/components/MapboxAdvanced"

// ✅ TYPE
type Worker = {
  id: string
  first_name: string
  last_name: string
  lat: number
  lng: number
  job_role: string
}

export default function AdvancedSearchPage() {

  // ✅ STATE
  const [workers, setWorkers] = useState<Worker[]>([])
  const [center, setCenter] = useState<[number, number]>([121.0437, 14.6760])
  const [radius, setRadius] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ AUTO GPS
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.longitude, pos.coords.latitude])
      },
      () => {
        console.log("GPS denied")
      }
    )
  }, [])

  // ✅ FETCH WORKERS
  async function searchWorkers() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/search-workers", {
        method: "POST",
        body: JSON.stringify({
          lat: center[1],
          lng: center[0],
          radius,
        }),
      })

      const data = await res.json()
      setWorkers(data)

    } catch (err) {
      setError("Failed to fetch workers")
    }

    setLoading(false)
  }

  return (
    <div className="p-6">

      {/* HEADER */}
      <h1 className="text-xl font-semibold mb-4">Advanced Search</h1>

      {/* MAP */}
      <div className="h-[400px] rounded-xl overflow-hidden mb-4">
        <MapBoxAdvanced
          center={center}
          workers={workers}
          radius={radius}
        />
      </div>

      {/* CONTROLS */}
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="border px-3 py-2 rounded w-[120px]"
        />

        <button
          onClick={searchWorkers}
          className="bg-[#0CC8B0] text-white px-4 py-2 rounded"
        >
          Search
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {/* RESULTS TABLE */}
      <div className="bg-white rounded-xl shadow">

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th>Job Role</th>
              <th>Location</th>
            </tr>
          </thead>

          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-t hover:bg-gray-50">

                <td className="p-3">
                  {w.first_name} {w.last_name}
                </td>

                <td>{w.job_role}</td>

                <td>
                  {w.lat.toFixed(3)}, {w.lng.toFixed(3)}
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="p-4 text-center">Loading...</div>
        )}

      </div>

    </div>
  )
}