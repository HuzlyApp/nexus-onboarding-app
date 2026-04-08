"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import OnboardingStepper from "@/app/components/OnboardingStepper"
import Link from "next/link"
import { Upload } from "lucide-react"

export default function Step1Upload(){

  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)

  const [file,setFile] = useState<File | null>(null)
  const [agree,setAgree] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  function persistSelectedFile(selected: File) {
    localStorage.setItem("resumeName", selected.name)
    localStorage.setItem("resumeSizeBytes", String(selected.size))
    localStorage.setItem("resumeMimeType", selected.type || "")
    // Clear previous parsing results when choosing a new file.
    localStorage.removeItem("parsedResume")
  }

  function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const selected = e.target.files?.[0]
    if(!selected) return

    // ✅ SIZE VALIDATION
    if(selected.size > 10 * 1024 * 1024){
      alert("Max file size is 10MB")
      return
    }

    setFile(selected)
    persistSelectedFile(selected)
  }

  function browse(){
    fileInput.current?.click()
  }

  function drop(e:React.DragEvent){
    e.preventDefault()
    setDragActive(false)
    const dropped = e.dataTransfer.files[0]
    if(!dropped) return

    if(dropped.size > 10 * 1024 * 1024){
      alert("Max file size is 10MB")
      return
    }

    setFile(dropped)
    persistSelectedFile(dropped)
  }

  function dragOver(e:React.DragEvent){
    e.preventDefault()
    setDragActive(true)
  }

  function dragLeave(e:React.DragEvent){
    e.preventDefault()
    setDragActive(false)
  }

  function next(){
    if(!file){
      alert("Please upload your resume")
      return
    }

    if(!agree){
      alert("Please accept Terms & Conditions")
      return
    }

    ;(async () => {
      setParsing(true)
      setParseError(null)
      try {
        // 1) Extract text from the uploaded PDF
        const fd = new FormData()
        fd.append("file", file)
        const uploadRes = await fetch("/api/upload-resume", {
          method: "POST",
          body: fd,
        })
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}))
          throw new Error(data?.error || "Failed to read resume")
        }
        const uploadJson = (await uploadRes.json()) as { text: string; fileName?: string }
        const text = uploadJson?.text
        if (!text || typeof text !== "string" || !text.trim()) {
          throw new Error("Could not extract text from the resume PDF")
        }

        // 2) Convert extracted text into structured JSON
        const processRes = await fetch("/api/process-resume", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text }),
        })
        if (!processRes.ok) {
          const data = await processRes.json().catch(() => ({}))
          throw new Error(data?.error || "Failed to parse resume")
        }
        const parsed = await processRes.json()

        localStorage.setItem("parsedResume", JSON.stringify(parsed))
        localStorage.setItem("resumeName", uploadJson?.fileName || file.name)
        router.push("/application/step-1-success")
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to parse resume"
        setParseError(msg)
        setFile((prev) => prev) // keep selection
      } finally {
        setParsing(false)
      }
    })()
  }

  return(
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center p-4 md:p-8">

      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex overflow-hidden min-h-[540px]">

        <div className="w-full md:w-2/3 p-8 md:p-10">

          <OnboardingStepper currentStep={1}/>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-6">
            Upload your resume
          </h2>

          <div
            onDrop={drop}
            onDragOver={dragOver}
            onDragLeave={dragLeave}
            role="button"
            tabIndex={0}
            onClick={browse}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
              dragActive ? "border-teal-700 bg-teal-50" : "border-teal-300"
            }`}
          >

            {file ? (
              <div className="text-teal-700 font-semibold">
                ✅ {file.name}
              </div>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-50 grid place-items-center text-teal-700 mb-4">
                  <Upload className="w-6 h-6" />
                </div>

                <p className="text-gray-500 mb-4">
                  Drag your file(s) to start uploading
                </p>

                <div className="text-xs text-gray-400 mb-2">OR</div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    browse()
                  }}
                  className="border border-teal-600 text-teal-700 px-6 py-2 rounded-md text-sm hover:bg-teal-50"
                >
                  Browse files
                </button>

                <p className="text-xs text-gray-400 mt-4">
                  Max 10 MB files are allowed
                </p>
              </>
            )}

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              ref={fileInput}
              className="hidden"
              onChange={handleFile}
            />
          </div>

          <div className="mt-3 text-xs text-gray-400">
            Only support .docx or pdf files
          </div>

          {parseError ? (
            <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              {parseError}
            </div>
          ) : null}

          <div className="flex items-center gap-2 mt-6 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={()=>setAgree(!agree)}
              className="accent-teal-600"
            />

            <span className="text-gray-600">
              By checking this box you agree to our{" "}
              <Link href="#" className="text-teal-700 ml-1 underline">
                Terms &amp; Conditions
              </Link>
            </span>
          </div>

          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={()=>router.back()}
              className="border px-6 py-2 rounded-xl text-gray-600 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={next}
              disabled={parsing}
              className={`bg-teal-700 hover:bg-teal-800 text-white px-8 py-2 rounded-xl text-sm transition ${
                parsing ? "opacity-70 cursor-not-allowed hover:bg-teal-700" : ""
              }`}
            >
              {parsing ? "Parsing..." : "Next →"}
            </button>
          </div>

        </div>

        <div className="hidden md:block w-1/3 relative">
          <Image src="/images/nurse.jpg" alt="nurse" fill className="object-cover grayscale"/>
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
            <div className="flex flex-col items-center">
              <Image
                src="/images/nexus-logo.png"
                alt="Nexus MedPro Logo"
                width={220}
                height={80}
                className="w-56 h-auto"
                priority
              />
              <div className="mt-6 h-px w-56 bg-zinc-300" />
              <div className="mt-4 text-xs text-zinc-700">
                Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}