// app/application/step-4-identity/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import OnboardingLayout from "../../components/OnboardingLayout"
import StepProgress from "../../components/StepProgress"
import FileUploadBox from "../../components/FileUploadBox"

export default function Step4Identity() {
  const router = useRouter()

  const [ssnFile, setSsnFile] = useState<File | null>(null)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper: upload file to Supabase Storage and return public URL
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const path = `${folder}/${Date.now()}-${sanitizedName}`

    const { error: uploadError } = await supabase.storage
      .from("worker_required_files")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message || "File upload failed")

    const { data: urlData } = supabase.storage
      .from("worker_required_files")
      .getPublicUrl(path)

    if (!urlData.publicUrl) throw new Error("Could not generate public URL")

    return urlData.publicUrl
  }

  const handleNext = async () => {
    setError(null)

    // Button is disabled, but double-check
    if (!ssnFile || !licenseFile) {
      setError("Please upload both SSN Card and Driver's License")
      return
    }

    setLoading(true)

    try {
      // Upload files
      const ssnUrl = await uploadFile(ssnFile, "ssn")
      const licenseUrl = await uploadFile(licenseFile, "license")

      // Get or create applicant ID
      let applicantId = localStorage.getItem("applicantId")
      if (!applicantId) {
        applicantId = crypto.randomUUID()
        localStorage.setItem("applicantId", applicantId)
      }

      // Optional: save to database (worker_documents table)
      const { error: dbError } = await supabase
        .from("worker_documents")
        .insert({
          applicant_id: applicantId,
          ssn_url: ssnUrl,
          drivers_license_url: licenseUrl,
          uploaded_at: new Date().toISOString(),
        })

      if (dbError) throw dbError

      // Store previews for next page (step-4-documents)
      localStorage.setItem(
        "identityDocuments",
        JSON.stringify({
          ssn: {
            name: ssnFile.name,
            url: ssnUrl,
          },
          license: {
            name: licenseFile.name,
            url: licenseUrl,
          },
          uploadedAt: new Date().toISOString(),
        })
      )

      // Clear local form state
      setSsnFile(null)
      setLicenseFile(null)

      // Go to next step
      router.push("/application/step-4-documents")
    } catch (err: unknown) {
      console.error("Upload/save error:", err)
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <StepProgress />

        <h2 className="text-xl sm:text-2xl font-semibold text-black mb-6">
          SSN & Drivers License
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* SSN Card */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              SSN Card <span className="text-red-600">*</span>
            </label>
            <FileUploadBox
              file={ssnFile}
              setFile={setSsnFile}
              accept="image/png,image/jpeg,image/jpg,application/pdf"
            />
          </div>

          {/* Driver's License */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Drivers License <span className="text-red-600">*</span>
            </label>
            <FileUploadBox
              file={licenseFile}
              setFile={setLicenseFile}
              accept="image/png,image/jpeg,image/jpg,application/pdf"
            />
          </div>

          <p className="text-xs text-gray-500">
            Supported formats: PNG, JPG, JPEG, PDF • Max size: 10 MB per file
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-10">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

        <button
  type="button"
  onClick={handleNext}
  disabled={loading}   // ← only loading disables it
  className={`px-6 py-2.5 min-w-[160px] rounded-lg text-white font-medium transition
    ${loading
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-teal-600 hover:bg-teal-700 shadow-sm"
    }`}
>
  {loading ? "Uploading..." : "Save & Continue"}
</button>
        </div>
      </div>
    </OnboardingLayout>
  )
}