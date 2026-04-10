// app/application/step-4-documents/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { supabaseBrowser as supabase } from "@/lib/supabase-browser"
import OnboardingStepper from "@/app/components/OnboardingStepper"

const DISCLAIMER =
  "By selecting “I Agree,” I authorize the Company to conduct a background check and, if required, a drug screening as part of my application or continued engagement. I understand this may include verification of my identity, employment history, education, and criminal records as permitted by law. I consent to the lawful collection, use, and disclosure of this information and release the Company from liability related to these authorized checks."

export default function DocumentsPage() {
  const router = useRouter()

  const [applicantId, setApplicantId] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [identityDocsComplete, setIdentityDocsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zohoNote, setZohoNote] = useState<string | null>(null)

  const [signerEmail, setSignerEmail] = useState("")
  const [signerName, setSignerName] = useState("")

  const [signingUrl, setSigningUrl] = useState<string | null>(null)
  const [signingLoading, setSigningLoading] = useState(false)
  const [envelopeId, setEnvelopeId] = useState<string | null>(null)
  const [isSigned, setIsSigned] = useState(false)
  /** Zoho omits redirect on http://localhost; user confirms completion here. */
  const [signingCompleteManual, setSigningCompleteManual] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem("applicantId")
    if (id) {
      setApplicantId(id)
    } else {
      router.push("/application/step-1-review")
    }
  }, [router])

  useEffect(() => {
    const saved = localStorage.getItem("parsedResume")
    if (!saved) return
    try {
      const p = JSON.parse(saved) as Record<string, string>
      const em = (p.email || "").trim()
      const fn = (p.firstName || p.first_name || "").trim()
      const ln = (p.lastName || p.last_name || "").trim()
      if (em) setSignerEmail(em)
      if (fn || ln) setSignerName(`${fn} ${ln}`.trim())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!applicantId) return
    void supabase
      .from("worker")
      .select("email, first_name, last_name")
      .eq("user_id", applicantId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.email?.trim()) setSignerEmail(data.email.trim())
        const fn = (data?.first_name || "").trim()
        const ln = (data?.last_name || "").trim()
        if (fn || ln) setSignerName(`${fn} ${ln}`.trim())
      })
  }, [applicantId])

  const refreshIdentityDocsStatus = useCallback(async () => {
    if (!applicantId) return
    const { data: w } = await supabase.from("worker").select("id").eq("user_id", applicantId).maybeSingle()
    if (!w?.id) {
      setIdentityDocsComplete(false)
      return
    }
    const { data: docs } = await supabase
      .from("worker_documents")
      .select("ssn_url, drivers_license_url")
      .eq("worker_id", w.id)
      .maybeSingle()
    const s = docs?.ssn_url?.trim()
    const d = docs?.drivers_license_url?.trim()
    setIdentityDocsComplete(Boolean(s && d))
  }, [applicantId])

  useEffect(() => {
    void refreshIdentityDocsStatus()
  }, [refreshIdentityDocsStatus])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshIdentityDocsStatus()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [refreshIdentityDocsStatus])

  const startSigning = useCallback(async () => {
    if (!agreed) {
      setError("Please agree to the authorization first.")
      return
    }
    if (!signerEmail || !signerName) {
      setError("Missing your name or email. Complete Step 1 (review your profile) first.")
      return
    }
    if (!applicantId) return

    setSigningLoading(true)
    setError(null)
    setSigningCompleteManual(false)

    try {
      const res = await fetch("/api/docusign/create-embedded-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId,
          email: signerEmail,
          name: signerName,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to prepare signing session")
      }

      const data = (await res.json()) as {
        signingUrl?: string
        envelopeId?: string
        signingCompleteManual?: boolean
      }

      setSigningUrl(data.signingUrl ?? null)
      setEnvelopeId(data.envelopeId ?? null)
      setSigningCompleteManual(Boolean(data.signingCompleteManual))
      if (data.envelopeId) localStorage.setItem("signingRequestId", data.envelopeId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signing setup failed"
      setError(message)
    } finally {
      setSigningLoading(false)
    }
  }, [agreed, applicantId, signerEmail, signerName])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const d = event.data
      if (
        (d?.source === "docusign" || d?.source === "zoho" || d?.source === "signing") &&
        d?.event === "signing_complete"
      ) {
        setIsSigned(true)
        setSigningUrl(null)
      }
    }

    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  const syncZoho = async () => {
    if (!applicantId) return
    setZohoNote(null)
    try {
      const res = await fetch("/api/zoho/sync-onboarding-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 503 || String(data.error || "").includes("not configured")) {
          setZohoNote("Zoho sync skipped (not configured on server).")
          return
        }
        setZohoNote(data.error || "Zoho sync did not complete.")
        return
      }
      if (typeof data.synced === "number" && data.synced > 0) {
        setZohoNote(`Synced ${data.synced} file(s) to Zoho Recruit.`)
      }
    } catch {
      setZohoNote("Zoho sync failed.")
    }
  }

  const handleSaveAndContinue = async () => {
    if (!agreed) {
      setError("You must agree to the authorization.")
      return
    }

    if (!isSigned) {
      setError("Please sign the authorization document first.")
      return
    }

    if (!identityDocsComplete) {
      setError("Please upload your SSN and driver's license on the identity step (open “SSN & Driver's License” above).")
      return
    }

    await syncZoho()

    router.push("/application/step-4-identity")
  }

  const handleSkipForNow = () => {
    localStorage.setItem("step4Skipped", "1")
    router.push("/application/step-4-identity")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6 border-b bg-gray-50">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={handleSkipForNow}
              className="text-sm font-medium text-teal-700 hover:text-teal-900"
            >
              Skip for Now &gt;
            </button>
          </div>
          <OnboardingStepper currentStep={4} />
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-8 lg:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Authorizations &amp; Documents</h1>

            <p className="text-gray-700 mb-6 leading-relaxed">{DISCLAIMER}</p>

            <label className="flex items-start gap-3 mb-10 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 accent-teal-600"
              />
              <span className="text-gray-800 font-medium">I Agree to the Authorization</span>
            </label>

            <h2 className="text-lg font-semibold text-gray-900 mb-3">Review and Sign</h2>
            <div className="mb-10 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">Auth Release form.pdf</p>
                    <p className="text-sm text-gray-500">Mandatory</p>
                  </div>
                </div>

                {!signingUrl && !isSigned && (
                  <button
                    type="button"
                    onClick={startSigning}
                    disabled={signingLoading || !agreed}
                    className={`px-5 py-2 rounded-lg text-white transition shrink-0 ${
                      signingLoading || !agreed ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
                    }`}
                  >
                    {signingLoading ? "Preparing…" : "Click and Sign"}
                  </button>
                )}

                {isSigned && (
                  <span className="px-5 py-2 bg-green-600 text-white rounded-lg shrink-0">Signed ✓</span>
                )}
              </div>

              {envelopeId && (
                <p className="mt-3 text-xs text-gray-400 truncate">Request ID: {envelopeId}</p>
              )}

              {signingUrl && (
                <div className="mt-6">
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <iframe
                      title="Sign document"
                      src={signingUrl}
                      width="100%"
                      height="640"
                      allow="clipboard-write"
                      className="min-h-[640px] w-full"
                    />
                  </div>
                  {signingCompleteManual && !isSigned && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <p className="mb-3">
                        Local <code className="text-xs">http://</code> URLs cannot be used as Zoho Sign return
                        addresses. After you finish signing in the window above, confirm here to continue.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSigned(true)
                          setSigningUrl(null)
                          setSigningCompleteManual(false)
                        }}
                        className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
                      >
                        I&apos;ve finished signing
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Add Documents</h2>

              <button
                type="button"
                onClick={() => router.push("/application/step-4-identity")}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:bg-teal-50/80 text-left transition"
              >
                <div>
                  <p className="font-medium text-gray-900">SSN &amp; Driver&apos;s License</p>
                  <p className="text-sm text-amber-700 font-medium mt-1">Required</p>
                  {identityDocsComplete ? (
                    <p className="text-sm text-green-700 font-medium mt-1">Uploaded ✓</p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Tap to open upload page</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-teal-600 shrink-0" aria-hidden />
              </button>
            </div>

            {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}
            {zohoNote && <p className="mb-4 text-teal-800 text-sm">{zohoNote}</p>}

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-3 border border-teal-600 text-teal-700 rounded-xl hover:bg-teal-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={!agreed || !isSigned || !identityDocsComplete}
                className={`px-8 py-3 rounded-xl text-white font-medium min-w-[160px] transition ${
                  !agreed || !isSigned || !identityDocsComplete
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                Save &amp; Continue
              </button>
            </div>
          </div>

          <div className="w-full lg:w-96 bg-gray-50 p-8 lg:p-12 flex flex-col items-center justify-center border-t lg:border-l">
            <img src="/images/nexus-logo.png" alt="Nexus MedPro Logo" className="w-48 mb-8" />
            <p className="text-center text-gray-700 text-sm leading-relaxed">
              Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
