import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl } from "@/lib/supabase-env"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const applicantId = typeof body.applicantId === "string" ? body.applicantId.trim() : ""
    if (!applicantId) {
      return NextResponse.json({ error: "Missing applicantId" }, { status: 400 })
    }

    const url = getSupabaseUrl()
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url) {
      return NextResponse.json(
        {
          error: "MISSING_SUPABASE_URL",
          hint: "Set NEXT_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL in .env.local",
        },
        { status: 503 }
      )
    }
    if (!key) {
      // Client may fall back to anon Supabase client if RLS allows inserts on `worker`.
      return NextResponse.json(
        {
          error: "MISSING_SERVICE_ROLE_KEY",
          hint: "Set SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase → Project Settings → API → service_role). This is a secret key, not a job title or the worker table.",
        },
        { status: 503 }
      )
    }

    const supabase = createClient(url, key)

    // `user_id` is the stable onboarding key (matches localStorage applicantId, must be a UUID).
    const row = {
      user_id: applicantId,
      first_name: String(body.firstName ?? "").trim(),
      last_name: String(body.lastName ?? "").trim(),
      address1: String(body.address1 ?? "").trim(),
      address2: String(body.address2 ?? "").trim(),
      city: String(body.city ?? "").trim(),
      state: String(body.state ?? "").trim(),
      zip: String(body.zipCode ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      email: String(body.email ?? "").trim(),
      job_role: String(body.jobRole ?? "").trim(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("worker").upsert(row, { onConflict: "user_id" })

    if (error) {
      console.error("[onboarding/save-worker]", error)
      const msg = [error.message, error.details, error.hint].filter(Boolean).join(" — ")
      return NextResponse.json({ error: msg || "Database error" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error("[onboarding/save-worker]", err)
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
