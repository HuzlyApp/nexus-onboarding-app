import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
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