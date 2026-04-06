import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return Response.json({ error: "Supabase is not configured" }, { status: 503 })
  }

  const supabase = createClient(url, key)

  const { lat, lng, radius } = await req.json()

  const { data, error } = await supabase.rpc("nearby_workers", {
    lat,
    lng,
    radius_meters: radius * 1609, // miles → meters
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}