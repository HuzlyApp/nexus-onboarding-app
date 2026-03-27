"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import OnboardingStepper from "@/app/components/OnboardingStepper"

export default function Step1Upload(){

  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)

  const [file,setFile] = useState<File | null>(null)
  const [agree,setAgree] = useState(false)

  function handleFile(e:React.ChangeEvent<HTMLInputElement>){
    const selected = e.target.files?.[0]
    if(!selected) return

    // ✅ SIZE VALIDATION
    if(selected.size > 10 * 1024 * 1024){
      alert("Max file size is 10MB")
      return
    }

    setFile(selected)
    localStorage.setItem("resumeName",selected.name)

    const reader = new FileReader()
    reader.onload = ()=>{
      localStorage.setItem("resumeFile",reader.result as string)
    }
    reader.readAsDataURL(selected)
  }

  function browse(){
    fileInput.current?.click()
  }

  function drop(e:React.DragEvent){
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if(!dropped) return

    if(dropped.size > 10 * 1024 * 1024){
      alert("Max file size is 10MB")
      return
    }

    setFile(dropped)
    localStorage.setItem("resumeName",dropped.name)

    const reader = new FileReader()
    reader.onload = ()=>{
      localStorage.setItem("resumeFile",reader.result as string)
    }
    reader.readAsDataURL(dropped)
  }

  function dragOver(e:React.DragEvent){
    e.preventDefault()
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

    router.push("/application/step-1-success")
  }

  return(
    <div className="min-h-screen bg-gradient-to-r from-teal-400 to-emerald-500 flex items-center justify-center p-12">

      <div className="bg-white w-[1280px] rounded-xl shadow-xl flex overflow-hidden">

        <div className="w-2/3 p-10">

          <OnboardingStepper currentStep={1}/>

          <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-6">
            Upload your resume
          </h2>

          <div
            onDrop={drop}
            onDragOver={dragOver}
            className="border-2 border-dashed border-teal-400 rounded-xl p-10 text-center cursor-pointer"
          >

            {file ? (
              <div className="text-teal-600 font-semibold">
                ✔ {file.name}
              </div>
            ) : (
              <>
                <div className="text-teal-500 text-4xl mb-4">📁</div>

                <p className="text-gray-500 mb-4">
                  Drag your file(s) to start uploading
                </p>

                <button
                  onClick={browse}
                  className="border border-teal-500 text-teal-600 px-6 py-2 rounded-md"
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

          <div className="flex items-center gap-2 mt-6 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={()=>setAgree(!agree)}
              className="accent-teal-600"
            />

            <span className="text-gray-600">
              By checking this box you agree to our
              <span className="text-teal-600 ml-1 underline">
                Terms & Conditions
              </span>
            </span>
          </div>

          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={()=>router.back()}
              className="border px-6 py-2 rounded-md text-gray-600"
            >
              Cancel
            </button>

            <button
              onClick={next}
              className="bg-teal-600 text-white px-8 py-2 rounded-md"
            >
              Next →
            </button>
          </div>

        </div>

        <div className="w-1/3 relative">
          <Image src="/images/nurse.jpg" alt="nurse" fill className="object-cover grayscale"/>
        </div>

      </div>
    </div>
  )
}