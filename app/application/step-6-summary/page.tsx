// app/application/step-6-summary/page.tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import OnboardingLayout from "@/app/components/OnboardingLayout"
import OnboardingStepper from "@/app/components/OnboardingStepper"
import { supabaseBrowser as supabase } from "@/lib/supabase-browser"

type SummaryRowProps = {
  label: string
  complete: boolean
  onClick?: () => void
  rightText?: string
}

function SummaryRow({ label, complete, onClick, rightText }: SummaryRowProps) {
  const clickable = Boolean(onClick)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full flex items-center justify-between rounded-md border px-4 py-3 transition ${
        complete ? "border-teal-200 bg-teal-50" : "border-gray-200 bg-white"
      } ${clickable ? "hover:bg-teal-50/60" : "cursor-default"}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            complete ? "bg-teal-600 text-white" : "border border-gray-300 text-transparent"
          }`}
          aria-hidden
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </div>
        <span className="text-sm font-medium text-gray-900 truncate">{label}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {rightText ? <span className="text-xs text-gray-500">{rightText}</span> : null}
        <span className="text-gray-400" aria-hidden>
          ›
        </span>
      </div>
    </button>
  )
}

function safeCount(n: number | null | undefined) {
  return typeof n === "number" && Number.isFinite(n) ? n : 0
}

export default function SummaryPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [resumeUploaded, setResumeUploaded] = useState(false)

  const [reqLicense, setReqLicense] = useState(false)
  const [reqTb, setReqTb] = useState(false)
  const [reqCpr, setReqCpr] = useState(false)

  const [skillsCompleted, setSkillsCompleted] = useState(0)
  const [skillsTotal, setSkillsTotal] = useState(0)

  const [authSigned, setAuthSigned] = useState(false)
  const [ssnUploaded, setSsnUploaded] = useState(false)
  const [dlUploaded, setDlUploaded] = useState(false)

  const [referencesCount, setReferencesCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const { data: userData, error: authErr } = await supabase.auth.getUser()
      const user = userData?.user
      if (authErr || !user) {
        setLoadError("Please sign in to view your summary.")
        setLoading(false)
        return
      }

      // Resume is not persisted to DB in the current flow; use localStorage as source of truth.
      const resumeName = localStorage.getItem("resumeName")
      const parsedResume = localStorage.getItem("parsedResume")
      setResumeUploaded(Boolean((resumeName && resumeName.trim()) || (parsedResume && parsedResume.trim())))

      // Worker id
      const { data: worker, error: wErr } = await supabase
        .from("worker")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
      if (wErr) throw new Error(wErr.message || "Could not load worker profile.")
      if (!worker?.id) throw new Error("Worker profile not found. Please complete Step 1 first.")
      const workerId = String(worker.id)

      // Step 2 requirements (worker_documents)
      const { data: docs, error: dErr } = await supabase
        .from("worker_documents")
        .select("nursing_license_url, tb_test_url, cpr_certification_url")
        .eq("worker_id", workerId)
        .maybeSingle()
      if (dErr) {
        // If the table/columns aren't migrated yet, treat as incomplete.
        console.error("[step-6-summary] worker_documents", dErr)
      } else {
        const t = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "")
        setReqLicense(Boolean(t(docs?.nursing_license_url)))
        setReqTb(Boolean(t(docs?.tb_test_url)))
        setReqCpr(Boolean(t(docs?.cpr_certification_url)))
      }

      // Skill assessment (count completed vs categories)
      const { data: cats, error: cErr } = await supabase.from("skill_categories").select("id")
      if (cErr) {
        console.error("[step-6-summary] skill_categories", cErr)
        setSkillsTotal(0)
      } else {
        setSkillsTotal((cats ?? []).length)
      }

      // Some parts of the app historically wrote assessments with worker_id = user.id; support both.
      const { data: doneA, error: aErr } = await supabase
        .from("skill_assessments")
        .select("id")
        .eq("completed", true)
        .eq("user_id", user.id)
      if (aErr) {
        console.error("[step-6-summary] skill_assessments", aErr)
        setSkillsCompleted(0)
      } else {
        setSkillsCompleted((doneA ?? []).length)
      }

      // Step 4: authorization + identity docs
      // Signed: if we have an envelope/request id stored locally, treat as signed for UI purposes.
      const signingRequestId = localStorage.getItem("signingRequestId")
      setAuthSigned(Boolean(signingRequestId && signingRequestId.trim()))

      const applicantId = user.id
      const reqRes = await fetch(
        `/api/onboarding/worker-documents?applicantId=${encodeURIComponent(applicantId)}`
      )
      const reqJson = (await reqRes.json().catch(() => ({}))) as {
        documents?: Record<string, unknown> | null
      }
      const r = reqJson.documents || {}
      const tp = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "")
      setSsnUploaded(Boolean(tp(r["ssn_url"])))
      setDlUploaded(Boolean(tp(r["drivers_license_url"])))

      // Step 5: references count
      const { count, error: rErr } = await supabase
        .from("worker_references")
        .select("id", { count: "exact", head: true })
        .eq("worker_id", workerId)
      if (rErr) {
        console.error("[step-6-summary] worker_references", rErr)
        setReferencesCount(0)
      } else {
        setReferencesCount(safeCount(count))
      }

      setLoading(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not load summary."
      setLoadError(msg)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const requirementsComplete = reqLicense && reqTb && reqCpr
  const skillsComplete = skillsTotal > 0 ? skillsCompleted >= skillsTotal : skillsCompleted > 0
  const authDocsComplete = authSigned && ssnUploaded && dlUploaded
  const referencesComplete = referencesCount >= 2

  const completedSections = useMemo(() => {
    return [resumeUploaded, requirementsComplete, skillsComplete, authDocsComplete, referencesComplete].filter(Boolean)
      .length
  }, [authDocsComplete, referencesComplete, requirementsComplete, resumeUploaded, skillsComplete])

  const totalSections = 5

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) throw new Error("Please sign in to submit your application.")

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId: user.id }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || "Could not submit application.")

      router.push("/application/application-received")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submit failed"
      setLoadError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <OnboardingLayout>
      <OnboardingStepper currentStep={6} />

      <div className="flex items-center justify-between mt-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Summary</h1>
        <span className="text-xs text-gray-500">
          {completedSections} of {totalSections} Completed
        </span>
      </div>

      {loadError ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Could not load summary</p>
          <p className="mt-1">{loadError}</p>
          <button type="button" onClick={() => void load()} className="mt-2 underline font-medium">
            Try again
          </button>
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Resume Uploaded</p>
          <SummaryRow
            label={resumeUploaded ? "Resume Uploaded" : "Upload Resume"}
            complete={resumeUploaded}
            onClick={() => router.push("/application/step-1-upload")}
          />
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Requirements</p>
          <div className="space-y-2">
            <SummaryRow
              label="Nursing License"
              complete={reqLicense}
              onClick={() => router.push("/application/step-2-license")}
            />
            <SummaryRow
              label="TB Test"
              complete={reqTb}
              onClick={() => router.push("/application/step-2-license")}
            />
            <SummaryRow
              label="CPR Certifications"
              complete={reqCpr}
              onClick={() => router.push("/application/step-2-license")}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Skill Assessment</p>
          <SummaryRow
            label={`${skillsCompleted} of ${skillsTotal || 0} Completed`}
            complete={skillsComplete}
            onClick={() => router.push("/application/step-3-assessment")}
          />
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Authorizations &amp; Documents</p>
          <div className="space-y-2">
            <SummaryRow
              label="Authorization Agreement"
              complete={authSigned}
              onClick={() => router.push("/application/step-4-documents")}
            />
            <SummaryRow
              label="SSN Card"
              complete={ssnUploaded}
              onClick={() => router.push("/application/step-4-identity")}
            />
            <SummaryRow
              label="Driver's License"
              complete={dlUploaded}
              onClick={() => router.push("/application/step-4-identity")}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">References</p>
          <SummaryRow
            label={`${referencesCount} of 3 Added`}
            complete={referencesComplete}
            onClick={() => router.push("/application/step-5-add-references")}
          />
        </div>
      </div>

      <div className="flex justify-between mt-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50 transition"
        >
          Back
        </button>

        <button
          type="button"
          disabled={loading || submitting}
          onClick={() => void handleSubmit()}
          className={`px-6 py-2.5 min-w-[160px] rounded-lg text-white font-medium transition ${
            loading || submitting ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 shadow-sm"
          }`}
        >
          {loading ? "Loading…" : submitting ? "Saving…" : "Save & Continue"}
        </button>
      </div>
    </OnboardingLayout>
  )
}