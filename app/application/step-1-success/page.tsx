"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import OnboardingStepper from "@/app/components/OnboardingStepper"

export default function Step1Success(){

  const router = useRouter()

  const [fileName,setFileName] = useState("")
  const [agree,setAgree] = useState(false)

  useEffect(() => {
    const name = localStorage.getItem("resumeName")
    if(name) setFileName(name)
  }, [])

  function removeFile(){
    localStorage.removeItem("resumeName")
    localStorage.removeItem("resumeFile")
    localStorage.removeItem("parsedResume")

    router.push("/application/step-1-upload")
  }

  function upload(){
    if(!agree){
      alert("Please accept Terms & Conditions")
      return
    }

    router.push("/application/step-1-review")
  }

  return(

    <div className="min-h-screen bg-gradient-to-r from-[#0CC8B0] to-[#0AAE9E] flex items-center justify-center p-12">

      <div className="w-[1200px] bg-white rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT */}
        <div className="flex-1 p-10">

          <OnboardingStepper currentStep={1}/>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-6">
            Resume Uploaded
          </h2>

          {/* SUCCESS ALERT */}
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

              {/* PDF ICON */}
              <div className="bg-[#E6F9F7] text-[#0CC8B0] px-3 py-2 rounded font-semibold text-sm">
                PDF
              </div>

              <div>
                <p className="text-gray-800 font-medium">
                  {fileName || "resume.pdf"}
                </p>
                <p className="text-xs text-gray-400">
                  9.6 MB
                </p>
              </div>

            </div>

            {/* DELETE */}
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
              onChange={()=>setAgree(!agree)}
              className="accent-[#0CC8B0]"
            />

            <span className="text-gray-600">
              By checking this box you agree to our
              <span className="text-[#0CC8B0] ml-1 underline cursor-pointer">
                Terms & Conditions
              </span>
            </span>

          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-4">

            <button
              onClick={()=>router.back()}
              className="border border-gray-300 px-6 py-2 rounded-lg text-gray-600"
            >
              Cancel
            </button>

            <button
              onClick={upload}
              className="bg-[#0CC8B0] text-white px-6 py-2 rounded-lg hover:bg-[#0AAE9E]"
            >
              Upload
            </button>

          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="w-[400px] relative bg-gray-100">

          <Image
            src="/images/nurse.jpg"
            alt="nurse"
            fill
            className="object-cover grayscale"
          />

          <div className="absolute inset-0 bg-white/70"/>

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