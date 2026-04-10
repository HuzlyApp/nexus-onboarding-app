"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Trash2, FileText } from "lucide-react"
import OnboardingStepper from "@/app/components/OnboardingStepper"
import { supabaseBrowser as supabase } from "@/lib/supabase-browser"
import { WORKER_REQUIRED_FILES_BUCKET } from "@/lib/supabase-storage-buckets"

type UploadType = "license" | "tb" | "cpr"

const LABELS: Record<UploadType, string> = {
  license: "Nursing License",
  tb: "TB Test",
  cpr: "CPR Certifications",
}

function UploadBox({
  label,
  file,
  onFile,
  onClear,
}: {
  label: string
  file: File | null
  onFile: (f: File) => void
  onClear: () => void
}) {
  const onDrop = (acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return
    onFile(acceptedFiles[0])
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg"], "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div className="mb-6">
      <p className="text-sm text-black mb-2">{label}</p>

      {file ? (
        <div className="border border-teal-300 bg-teal-50 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-teal-600" />
            <div>
              <p className="text-sm font-medium text-black">{file.name}</p>
              <p className="text-xs text-black">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          </div>
          <button type="button" onClick={onClear}>
            <Trash2 size={18} />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-teal-300 rounded-lg p-8 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <FileText className="text-teal-600" />
            <p className="text-sm text-black">Drag your file(s) to start uploading</p>
            <span className="border px-4 py-1 rounded text-sm text-black">Browse files</span>
            <p className="text-xs text-black">Max 10 MB files are allowed</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Step2License() {
  const router = useRouter()
  const [applicantId, setApplicantId] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<UploadType, File | null>>({
    license: null,
    tb: null,
    cpr: null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem("applicantId")
    if (!id) {
      router.replace("/application/step-1-review")
      return
    }
    setApplicantId(id)
  }, [router])

  const handleUpload = (file: File, type: UploadType) => {
    setError(null)
    const maxBytes = 10 * 1024 * 1024
    if (file.size > maxBytes) {
      setError("Each file must be 10 MB or smaller.")
      return
    }
    setFiles((prev) => ({ ...prev, [type]: file }))
  }

  const clearFile = (type: UploadType) => setFiles((prev) => ({ ...prev, [type]: null }))

  const uploadToStorage = async (file: File, applicant: string, kind: UploadType): Promise<string> => {
    const ext = file.name.split(".").pop() || "pdf"
    // Bucket layout: worker_required_files/license/{applicantId}/...
    const path = `license/${applicant}/${kind}-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from(WORKER_REQUIRED_FILES_BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    })
    if (upErr) throw new Error(upErr.message)
    const { data } = supabase.storage.from(WORKER_REQUIRED_FILES_BUCKET).getPublicUrl(path)
    if (!data.publicUrl) throw new Error("Could not get public URL")
    return data.publicUrl
  }

  const goNext = async () => {
    setError(null)
    if (!applicantId) return

    setSaving(true)
    try {
      const payload: {
        applicantId: string
        nursing_license_url?: string
        tb_test_url?: string
        cpr_certification_url?: string
      } = { applicantId }

      if (files.license) payload.nursing_license_url = await uploadToStorage(files.license, applicantId, "license")
      if (files.tb) payload.tb_test_url = await uploadToStorage(files.tb, applicantId, "tb")
      if (files.cpr) payload.cpr_certification_url = await uploadToStorage(files.cpr, applicantId, "cpr")

      const res = await fetch("/api/onboarding/worker-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || "Could not save documents")

      localStorage.setItem(
        "step2_files",
        JSON.stringify({
          license: files.license ? { name: files.license.name, size: files.license.size } : null,
          tb: files.tb ? { name: files.tb.name, size: files.tb.size } : null,
          cpr: files.cpr ? { name: files.cpr.name, size: files.cpr.size } : null,
        })
      )

      router.push("/application/step-2-review-req")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed"
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[1000px] rounded-xl shadow-xl flex overflow-hidden flex-col md:flex-row">
        <div className="w-full md:w-2/3 p-6 md:p-10">
          <OnboardingStepper currentStep={2} />

          <div className="flex items-center text-sm mb-6 flex-wrap gap-1">
            <span className="text-teal-600 font-medium">Add Resume</span>
            <div className="mx-3 h-[2px] w-6 bg-teal-500 shrink-0" />
            <span className="text-teal-600 font-semibold">Professional License</span>
            <div className="mx-3 h-[2px] w-6 bg-gray-300 shrink-0" />
            <span className="text-black">Skill Assessment</span>
            <div className="mx-3 h-[2px] w-6 bg-gray-300 shrink-0" />
            <span className="text-black">Authorizations & Documents</span>
            <div className="mx-3 h-[2px] w-6 bg-gray-300 shrink-0" />
            <span className="text-black">Add References</span>
            <div className="mx-3 h-[2px] w-6 bg-gray-300 shrink-0" />
            <span className="text-black">Summary</span>
          </div>

          <div className="flex justify-between mb-6">
            <h2 className="text-lg font-semibold text-black">Add Requirements</h2>
            <button
              type="button"
              onClick={() => router.push("/application/step-3-skills")}
              className="text-teal-600 text-sm"
            >
              Skip for Now →
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
          )}

          <UploadBox
            label={LABELS.license}
            file={files.license}
            onFile={(f) => handleUpload(f, "license")}
            onClear={() => clearFile("license")}
          />
          <UploadBox
            label={LABELS.tb}
            file={files.tb}
            onFile={(f) => handleUpload(f, "tb")}
            onClear={() => clearFile("tb")}
          />
          <UploadBox
            label={LABELS.cpr}
            file={files.cpr}
            onFile={(f) => handleUpload(f, "cpr")}
            onClear={() => clearFile("cpr")}
          />

          <p className="text-xs text-black mb-6">Only support png, jpg or pdf files</p>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="border px-4 py-2 rounded text-black">
              Back
            </button>
            <button
              type="button"
              onClick={() => void goNext()}
              disabled={saving || !applicantId}
              className="bg-teal-600 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {saving ? "Saving…" : "Next"}
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/3 bg-gray-100 relative min-h-[240px] md:min-h-0 flex items-center justify-center">
          <img src="/images/nurse.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="z-10 text-center px-6 py-8">
            <h2 className="text-2xl font-bold text-teal-700">NEXUS</h2>
            <div className="w-10 h-[2px] bg-teal-500 mx-auto my-3" />
            <p className="text-sm text-black">
              Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
