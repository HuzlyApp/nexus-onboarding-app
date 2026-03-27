// app/application/step-6-summary/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CheckCircle2, FileText, UserCheck, ShieldCheck, FileSignature } from "lucide-react"

import OnboardingLayout from "../../components/OnboardingLayout"
import OnboardingStepper from "@/app/components/OnboardingStepper" // adjust path if needed

// Type for identity document item
interface IdentityDoc {
  name: string
  url: string
}

// Type for identity documents object
interface IdentityDocs {
  ssn?: IdentityDoc
  license?: IdentityDoc
  uploadedAt?: string
}

// Type for parsed resume (adjust fields as needed)
interface ResumeData {
  first_name?: string
  last_name?: string
  job_role?: string
  [key: string]: unknown // flexible for extra fields
}

export default function SummaryPage() {
  const router = useRouter()

  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [identityDocs, setIdentityDocs] = useState<IdentityDocs | null>(null)
  const [skillStatus, setSkillStatus] = useState<string>("0 of 3 Completed")
  const [referencesCount, setReferencesCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // Load summary data safely
  useEffect(() => {
    let isMounted = true

    // 1. Resume
    const storedResume = localStorage.getItem("parsedResume")
    if (storedResume && isMounted) {
      try {
        const parsed = JSON.parse(storedResume)
        setResumeData(parsed)
      } catch (e) {
        console.error("Failed to parse resume:", e)
      }
    }

    // 2. Identity Documents (SSN + Driver's License)
    const storedIdentity = localStorage.getItem("identityDocuments")
    if (storedIdentity && isMounted) {
      try {
        const parsed = JSON.parse(storedIdentity)
        if (parsed?.uploadedAt) {
          const uploadedTime = new Date(parsed.uploadedAt).getTime()
          if (uploadedTime > Date.now() - 60 * 60 * 1000) { // 1 hour
            setIdentityDocs(parsed)
          } else {
            localStorage.removeItem("identityDocuments")
          }
        }
      } catch (e) {
        console.error("Failed to parse identityDocuments:", e)
        localStorage.removeItem("identityDocuments")
      }
    }

    // 3. Skill status (make dynamic from skill pages)
    const storedSkill = localStorage.getItem("skillStatus")
    if (storedSkill && isMounted) {
      setSkillStatus(storedSkill)
    }

    // 4. References count (make dynamic from step-5)
    const storedRefs = localStorage.getItem("referencesCount")
    if (storedRefs && isMounted) {
      setReferencesCount(Number(storedRefs) || 0)
    }

    return () => {
      isMounted = false
    }
  }, [])

  const handleFinalSubmit = () => {
    setLoading(true)

    // Optional: mark application complete in Supabase
    // await supabase.from("applications").update({ status: "submitted" }).eq("applicant_id", ...)

    // Clean up onboarding localStorage
    localStorage.removeItem("parsedResume")
    localStorage.removeItem("identityDocuments")
    localStorage.removeItem("skillStatus")
    localStorage.removeItem("referencesCount")
    // ... remove other keys you used

    // Redirect to success page
    router.push("/application/success")
  }

  return (
    <OnboardingLayout>
      <div className="min-h-screen bg-gradient-to-r from-teal-400 to-emerald-500 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[1280px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          {/* LEFT - Summary Content */}
          <div className="flex-1 p-8 md:p-12">
            <OnboardingStepper currentStep={6} />

            <div className="flex justify-between items-center mt-8 mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Summary
              </h1>
              <span className="text-sm font-medium text-gray-600">
                All Steps Completed
              </span>
            </div>

            {/* Resume */}
            <section className="mb-10">
              <h3 className="text-sm text-gray-600 font-medium mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Resume Uploaded
              </h3>
              {resumeData ? (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                  <p className="font-medium text-teal-800">
                    {resumeData.first_name} {resumeData.last_name || ""}s Resume
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {resumeData.job_role || "Healthcare Professional"} • Uploaded
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-gray-500 italic">
                  No resume data found
                </div>
              )}
            </section>

            {/* Skill Assessment */}
            <section className="mb-10">
              <h3 className="text-sm text-gray-600 font-medium mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                Skill Assessment
              </h3>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                <p className="font-medium text-teal-800">{skillStatus}</p>
              </div>
            </section>

            {/* Authorizations & Documents */}
            <section className="mb-10">
              <h3 className="text-sm text-gray-600 font-medium mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Authorizations & Documents
              </h3>
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                  <p className="font-medium text-teal-800">Authorization Agreement</p>
                  <p className="text-sm text-gray-600 mt-1">Signed</p>
                </div>

                {identityDocs?.ssn && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={identityDocs.ssn.url}
                          alt="SSN Card preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="font-medium text-teal-800">SSN Card</p>
                        <p className="text-sm text-gray-600">{identityDocs.ssn.name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {identityDocs?.license && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={identityDocs.license.url}
                          alt="Driver's License preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="font-medium text-teal-800">Drivers License</p>
                        <p className="text-sm text-gray-600">{identityDocs.license.name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* References */}
            <section className="mb-10">
              <h3 className="text-sm text-gray-600 font-medium mb-3 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-teal-600" />
                References
              </h3>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                <p className="font-medium text-teal-800">
                  {referencesCount} References Added
                </p>
              </div>
            </section>

            {/* Final Buttons */}
            <div className="flex justify-end gap-4 mt-12">
              <button
                onClick={() => router.back()}
                className="px-8 py-3 border border-gray-400 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Back
              </button>

              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className={`px-8 py-3 min-w-[180px] rounded-xl text-white font-medium transition shadow-sm
                  ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700"}
                `}
              >
                {loading ? "Finalizing..." : "Save & Finish"}
              </button>
            </div>
          </div>

          {/* RIGHT - Branding Image */}
          <div className="hidden md:block w-1/3 relative min-h-[600px]">
            <Image
              src="/images/nurse.jpg"
              alt="Nurse"
              fill
              className="object-cover grayscale"
            />
            <div className="absolute inset-0 bg-white/60" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <Image
                src="/images/nexus-logo.png"
                alt="Nexus Logo"
                width={180}
                height={60}
                className="mb-8"
              />
              <p className="text-gray-700 text-sm leading-relaxed max-w-xs">
                Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
              </p>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}