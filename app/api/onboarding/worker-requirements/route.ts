import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl } from "@/lib/supabase-env"

export const runtime = "nodejs"

type Body = {
  applicantId: string
  ssn_card_path?: string | null
  drivers_license_path?: string | null
  ssn_card_front_path?: string | null
  ssn_card_back_path?: string | null
  drivers_license_front_path?: string | null
  drivers_license_back_path?: string | null
}

const PATH_KEYS = [
  "ssn_card_path",
  "drivers_license_path",
  "ssn_card_front_path",
  "ssn_card_back_path",
  "drivers_license_front_path",
  "drivers_license_back_path",
] as const

const OTHER_KEYS = ["resume_path", "job_certificate_path", "drug_test_results_path", "w9_path"] as const

function normPath(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s ? s : null
}

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

    // Validate applicant has a worker row (keeps behavior aligned with other onboarding APIs)
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

    const { data, error } = await supabase
      .from("worker_requirements")
      .select(
        "worker_id, ssn_card_path, drivers_license_path, ssn_card_front_path, ssn_card_back_path, drivers_license_front_path, drivers_license_back_path, updated_at"
      )
      .eq("worker_id", applicantId)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({ requirements: data ?? null })
  } catch (err: unknown) {
    console.error("[onboarding/worker-requirements] GET", err)
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
      .from("worker_requirements")
      .select(
        "id, ssn_card_path, drivers_license_path, ssn_card_front_path, ssn_card_back_path, drivers_license_front_path, drivers_license_back_path, resume_path, job_certificate_path, drug_test_results_path, w9_path"
      )
      .eq("worker_id", applicantId)
      .limit(1)

    if (selErr) throw selErr

    const existing = existingRows?.[0] as Record<string, string | number | null | undefined> | undefined

    const merged: Record<string, string | null> = {}
    for (const k of PATH_KEYS) {
      if (body[k] !== undefined) {
        merged[k] = normPath(body[k])
      } else {
        merged[k] = normPath(existing?.[k]) ?? null
      }
    }

    const updated_at = new Date().toISOString()

    const rowPayload: Record<string, unknown> = {
      ...merged,
      updated_at,
    }
    for (const k of OTHER_KEYS) {
      rowPayload[k] = normPath(existing?.[k]) ?? null
    }

    if (existing?.id != null) {
      const { error: upErr } = await supabase.from("worker_requirements").update(rowPayload).eq("id", existing.id)

      if (upErr) {
        console.error("[onboarding/worker-requirements] update", upErr)
        const msg = [upErr.message, upErr.details, upErr.hint].filter(Boolean).join(" — ")
        return NextResponse.json({ error: msg || "Database error" }, { status: 500 })
      }
    } else {
      const { error: insErr } = await supabase.from("worker_requirements").insert({
        worker_id: applicantId,
        ...rowPayload,
      })

      if (insErr) {
        console.error("[onboarding/worker-requirements] insert", insErr)
        const msg = [insErr.message, insErr.details, insErr.hint].filter(Boolean).join(" — ")
        return NextResponse.json({ error: msg || "Database error" }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error("[onboarding/worker-requirements]", err)
    const msg = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
