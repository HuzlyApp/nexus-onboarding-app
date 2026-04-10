import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl } from "@/lib/supabase-env"

export const runtime = "nodejs"

type Body = {
  applicantId: string
  nursing_license_url?: string | null
  tb_test_url?: string | null
  cpr_certification_url?: string | null
  ssn_url?: string | null
  ssn_back_url?: string | null
  drivers_license_url?: string | null
  drivers_license_back_url?: string | null
}

const URL_KEYS = [
  "nursing_license_url",
  "tb_test_url",
  "cpr_certification_url",
  "ssn_url",
  "ssn_back_url",
  "drivers_license_url",
  "drivers_license_back_url",
] as const

export async function GET(req: NextRequest) {
  try {
    const applicantId = req.nextUrl.searchParams.get("applicantId")?.trim() || ""
    if (!applicantId) {
      return NextResponse.json({ error: "Missing applicantId" }, { status: 400 })
    }

    const url = getSupabaseUrl()
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase service role not configured" }, { status: 503 })
    }

    const supabase = createClient(url, key)

    const { data: worker, error: wErr } = await supabase
      .from("worker")
      .select("id")
      .eq("user_id", applicantId)
      .maybeSingle()

    if (wErr) throw wErr
    if (!worker?.id) {
      return NextResponse.json({ documents: null })
    }

    const { data, error } = await supabase
      .from("worker_documents")
      .select("*")
      .eq("worker_id", worker.id)
      .limit(1)

    if (error) throw error
    return NextResponse.json({ documents: data?.[0] ?? null })
  } catch (err: unknown) {
    console.error("[onboarding/worker-documents] GET", err)
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const applicantId = typeof body.applicantId === "string" ? body.applicantId.trim() : ""
    if (!applicantId) {
      return NextResponse.json({ error: "Missing applicantId" }, { status: 400 })
    }

    const url = getSupabaseUrl()
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase service role not configured" }, { status: 503 })
    }

    const supabase = createClient(url, key)

    const { data: worker, error: wErr } = await supabase
      .from("worker")
      .select("id")
      .eq("user_id", applicantId)
      .maybeSingle()

    if (wErr) throw wErr
    if (!worker?.id) {
      return NextResponse.json(
        { error: "Worker not found; complete Step 1 (profile) before uploading documents." },
        { status: 400 }
      )
    }

    const { data: existingRows, error: selErr } = await supabase
      .from("worker_documents")
      // Use "*" so this endpoint works even if newer columns
      // (e.g. ssn_back_url) haven't been migrated yet.
      .select("*")
      .eq("worker_id", worker.id)
      .limit(1)

    if (selErr) throw selErr

    const existing = existingRows?.[0] as Record<string, unknown> | undefined
    const ex = (existing || {}) as Record<string, string | null | undefined>

    const merged: Record<string, unknown> = {
      worker_id: worker.id,
      updated_at: new Date().toISOString(),
    }

    for (const k of URL_KEYS) {
      if (body[k] !== undefined) {
        const v = body[k]
        merged[k] = v && String(v).trim() ? String(v).trim() : null
      } else {
        // Only carry forward existing columns; don't send unknown keys
        // to older schemas (would trigger "column does not exist").
        if (Object.prototype.hasOwnProperty.call(ex, k)) {
          merged[k] = ex[k] ?? null
        }
      }
    }

    const existingId =
      existing?.id != null && existing.id !== "" ? String(existing.id) : undefined

    if (existingId) {
      const { worker_id: _w, ...updatePayload } = merged
      const { error: upErr } = await supabase.from("worker_documents").update(updatePayload).eq("id", existingId)
      if (upErr) {
        console.error("[onboarding/worker-documents] update", upErr)
        const msg = [upErr.message, upErr.details, upErr.hint].filter(Boolean).join(" — ")
        return NextResponse.json({ error: msg || "Database error" }, { status: 500 })
      }
    } else {
      const { error: insErr } = await supabase.from("worker_documents").insert(merged)
      if (insErr) {
        console.error("[onboarding/worker-documents] insert", insErr)
        const msg = [insErr.message, insErr.details, insErr.hint].filter(Boolean).join(" — ")
        return NextResponse.json({ error: msg || "Database error" }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error("[onboarding/worker-documents]", err)
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
