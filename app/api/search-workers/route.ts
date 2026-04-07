import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return Response.json({ error: "Supabase is not configured" }, { status: 503 })
  }

  const supabase = createClient(url, key)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const lat = typeof (body as any)?.lat === "number" ? (body as any).lat : Number((body as any)?.lat)
  const lng = typeof (body as any)?.lng === "number" ? (body as any).lng : Number((body as any)?.lng)
  const radius = typeof (body as any)?.radius === "number" ? (body as any).radius : Number((body as any)?.radius)

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0) {
    return Response.json({ error: "Invalid lat/lng/radius" }, { status: 400 })
  }

  const { data, error } = await supabase.rpc("nearby_workers", {
    lat,
    lng,
    radius_meters: radius * 1609.344, // miles → meters
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(Array.isArray(data) ? data : [])
}