"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import OnboardingStepper from "@/app/components/OnboardingStepper"

export default function Step1Success() {
  const router = useRouter()

  const [fileName, setFileName] = useState<string>("resume.pdf")
  const [agree, setAgree] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  // ✅ Fix hydration + localStorage
  useEffect(() => {
    setMounted(true)

    const name = localStorage.getItem("resumeName")
    if (name) setFileName(name)
  }, [])

  // ✅ REMOVE FILE
  const removeFile = () => {
    localStorage.removeItem("resumeName")
    localStorage.removeItem("resumeFile")
    localStorage.removeItem("parsedResume")

    router.push("/application/step-1-upload")
  }

  // ✅ CONTINUE
  const handleContinue = () => {
    if (!agree) {
      alert("Please accept Terms & Conditions")
      return
    }

    router.push("/application/step-1-review")
  }

  // ✅ Prevent hydration error
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0CC8B0] to-[#0AAE9E] flex items-center justify-center p-12">

      <div className="w-[1200px] h-[720px] bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT SIDE */}
        <div className="flex-1 p-10">

          {/* STEPPER */}
          <OnboardingStepper currentStep={1} />

          {/* TITLE */}
          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-6">
            Resume Uploaded
          </h2>

          {/* SUCCESS BOX */}
          <div className="flex items-center gap-3 border border-[#0CC8B0] bg-[#E6F9F7] text-[#0AAE9E] rounded-lg px-4 py-3 mb-6">
            <div className="w-6 h-6 flex items-center justify-center bg-[#0CC8B0] text-white rounded-full text-sm">
              ✓
            </div>

            <p className="text-sm">
              Resume parsed successfully. Carefully review your information before submitting the application.
            </p>
          </div>

          {/* FILE CARD */}
          <div className="flex items-center justify-between border border-[#0CC8B0] rounded-lg px-5 py-4 mb-6">

            <div className="flex items-center gap-4">

              <div className="bg-[#E6F9F7] text-[#0CC8B0] px-3 py-2 rounded font-semibold text-sm">
                PDF
              </div>

              <div>
                <p className="text-gray-800 font-medium">
                  {fileName}
                </p>
                <p className="text-xs text-gray-400">
                  9.6 MB
                </p>
              </div>

            </div>

            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-red-500 text-lg"
            >
              🗑
            </button>

          </div>

          {/* TERMS */}
          <div className="flex items-center gap-2 text-sm mb-10">

            <input
              type="checkbox"
              checked={agree}
              onChange={() => setAgree(!agree)}
              className="accent-[#0CC8B0]"
            />

            <span className="text-gray-600">
              By checking this box you agree to our
              <span className="text-[#0CC8B0] ml-1 underline cursor-pointer">
                Terms & Conditions
              </span>
            </span>

          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-4">

            <button
              onClick={() => router.back()}
              className="border border-gray-300 px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleContinue}
              className="bg-[#0CC8B0] text-white px-6 py-2 rounded-lg hover:bg-[#0AAE9E]"
            >
              Continue
            </button>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="w-[400px] relative">

          {/* IMAGE */}
          <Image
            src="/images/nurse.jpg"
            alt="nurse"
            fill
            className="object-cover grayscale"
            priority
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-white/70" />

          {/* CONTENT */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">

            <Image
              src="/images/nexus-logo.png"
              alt="logo"
              width={140}
              height={50}
              className="mb-4"
            />

            <p className="text-gray-700 text-sm">
              Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}