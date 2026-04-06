// app/application/step-4-documents/page.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabaseBrowser as supabase } from "@/lib/supabase-browser"

export default function DocumentsPage() {
  const router = useRouter()

  const [applicantId, setApplicantId] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // SignEasy states
  const [signingUrl, setSigningUrl] = useState<string | null>(null)
  const [signingLoading, setSigningLoading] = useState(false)
  const [envelopeId, setEnvelopeId] = useState<string | null>(null)
  const [isSigned, setIsSigned] = useState(false)

  useEffect(() => {
    const id = localStorage.getItem("applicantId")
    if (id) {
      setApplicantId(id)
    } else {
      router.push("/application/step-1-review")
    }
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setPreviewUrls(selected.map(file => URL.createObjectURL(file)))
    setError(null)
  }

  const uploadFiles = async (): Promise<boolean> => {
    if (!applicantId || files.length === 0) return false

    setUploading(true)
    setError(null)

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop() || "pdf"
        const fileName = `${applicantId}/${Date.now()}.${fileExt}`
        const filePath = `identity-documents/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
          })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath)

        return { path: filePath, publicUrl: urlData.publicUrl }
      })

      const results = await Promise.all(uploadPromises)
      setUploadedPaths(results.map(r => r.path))

      const { error: dbError } = await supabase
        .from("worker_documents")
        .upsert(
          results.map(r => ({
            applicant_id: applicantId,
            document_type: "SSN & Driver's License",
            file_path: r.path,
            uploaded_at: new Date().toISOString(),
          }))
        )

      if (dbError) throw dbError

      return true
    } catch (err: unknown) {
      console.error("Upload failed:", err)
      const message = err instanceof Error ? err.message : "Unknown upload error"
      setError(message)
      return false
    } finally {
      setUploading(false)
    }
  }

  const startSigning = useCallback(async () => {
    if (!agreed) {
      setError("Please agree to the authorization first.")
      return
    }

    setSigningLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/signeasy/create-embedded-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId,
          // You can pass applicant email/name if you collect it earlier
          email: "applicant@example.com", // ← replace with real value
          name: "Applicant Name",         // ← replace
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to prepare signing session")
      }

      const { signingUrl: url, envelopeId: eid } = await res.json()

      setSigningUrl(url)
      setEnvelopeId(eid)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signing setup failed"
      setError(message)
    } finally {
      setSigningLoading(false)
    }
  }, [agreed, applicantId])

  // Listen for signing complete message from iframe (recommended by most e-sign providers)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://sign.signeasy.com" && event.origin !== "https://api.signeasy.com") return

      if (event.data?.event === "signing_complete" || event.data?.status === "signed") {
        setIsSigned(true)
        setSigningUrl(null) // optional: hide iframe after success
        alert("Authorization signed successfully!")
      }
    }

    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  const handleSaveAndContinue = async () => {
    if (!agreed) {
      setError("You must agree to the authorization.")
      return
    }

    if (!isSigned) {
      setError("Please sign the authorization document first.")
      return
    }

    if (files.length > 0) {
      const ok = await uploadFiles()
      if (!ok) return
    }

    router.push("/application/step-4-identity")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Step Header – unchanged */}
        <div className="px-8 py-6 border-b bg-gray-50">
          <div className="flex items-center gap-4 overflow-x-auto">
            {[
              "Add Resume",
              "Professional License",
              "Skill Assessment",
              "Authorizations",
              "Add References",
              "Summary",
            ].map((step, i) => (
              <div key={step} className="flex items-center flex-1 min-w-[140px]">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    step === "Authorizations"
                      ? "bg-teal-600 text-white border-teal-600"
                      : "text-gray-400 border-gray-300"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 5 && <div className="flex-1 h-px bg-gray-300 mx-3" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-8 lg:p-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Authorization & Documents
            </h1>

            <p className="text-gray-700 mb-6 leading-relaxed">
              By selecting “I Agree,” I authorize the Company to conduct a background check and, if required, a drug screening...
            </p>
            {/* ... other paragraphs unchanged ... */}

            <label className="flex items-start gap-3 mb-10 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 accent-teal-600"
              />
              <span className="text-gray-800 font-medium">I Agree to the Authorization</span>
            </label>

            {/* Authorization Signing Section */}
            <div className="mb-10 p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Authorization_agreement.pdf</p>
                    <p className="text-sm text-gray-500">Mandatory - digital signature required</p>
                  </div>
                </div>

                {!signingUrl && !isSigned && (
                  <button
                    onClick={startSigning}
                    disabled={signingLoading || !agreed}
                    className={`px-5 py-2 rounded-lg text-white transition ${
                      signingLoading || !agreed ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
                    }`}
                  >
                    {signingLoading ? "Preparing..." : "Click and Sign"}
                  </button>
                )}

                {isSigned && (
                  <span className="px-5 py-2 bg-green-600 text-white rounded-lg">Signed ✓</span>
                )}
              </div>

              {signingUrl && (
                <div className="mt-6 border border-gray-300 rounded-lg overflow-hidden">
                  <iframe
                    src={signingUrl}
                    width="100%"
                    height="640"
                    allow="clipboard-write"
                    className="min-h-[640px]"
                  />
                </div>
              )}
            </div>

            {/* Documents upload section – unchanged except error display */}
            <div className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Add Documents</h2>
              {/* dropzone + previews – unchanged */}
              {previewUrls.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <Image src={url} alt={`Preview ${i + 1}`} width={300} height={200} className="object-cover w-full h-40" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{files[i]?.name || `Doc ${i + 1}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
            </div>

            <div className="flex gap-4 justify-end">
              <button
                onClick={() => router.back()}
                className="px-8 py-3 border border-gray-400 text-gray-700 rounded-xl hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleSaveAndContinue}
                disabled={uploading || !agreed || !isSigned}
                className={`px-8 py-3 rounded-xl text-white font-medium min-w-[160px] transition ${
                  uploading || !agreed || !isSigned ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {uploading ? "Uploading..." : "Save & Continue"}
              </button>
            </div>
          </div>

          {/* Sidebar – unchanged */}
          <div className="w-full lg:w-96 bg-gray-50 p-8 lg:p-12 flex flex-col items-center justify-center border-t lg:border-l">
            <img src="/nexus-logo.png" alt="Nexus MedPro Logo" className="w-48 mb-8" />
            <p className="text-center text-gray-700 text-sm leading-relaxed">
              Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}