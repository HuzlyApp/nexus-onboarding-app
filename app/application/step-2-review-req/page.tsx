"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { FileText, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import toast, { Toaster } from "react-hot-toast"

interface FileInfo {
  name: string
  size: string
  file?: File
}

interface FilesState {
  license: FileInfo | null
  tb: FileInfo | null
  cpr: FileInfo | null
}

interface FileRowProps {
  file: FileInfo | null
  type: keyof FilesState
  removeFile: (type: keyof FilesState) => void
}

const FileRow = ({ file, type, removeFile }: FileRowProps) => {

  if (!file) return null

  return (
    <div className="border border-teal-400 bg-teal-50 rounded-lg px-4 py-3 flex items-center justify-between">

      <div className="flex items-center gap-3">

        <FileText className="text-teal-600"/>

        <div>
          <p className="text-sm font-medium text-black">{file.name}</p>
          <p className="text-xs text-black">{file.size}</p>
        </div>

      </div>

      <button
        onClick={() => removeFile(type)}
        className="text-gray-700"
      >
        <Trash2 size={18}/>
      </button>

    </div>
  )
}

export default function Step2ReviewReq(){

  const router = useRouter()

  const [files,setFiles] = useState<FilesState>(() => {

    if (typeof window === "undefined") {
      return { license:null, tb:null, cpr:null }
    }

    const stored = localStorage.getItem("step2_files")

    if(!stored){
      return { license:null, tb:null, cpr:null }
    }

    return JSON.parse(stored)

  })

  function removeFile(type:keyof FilesState){

    setFiles(prev=>{

      const updated = {
        ...prev,
        [type]:null
      }

      localStorage.setItem("step2_files",JSON.stringify(updated))

      return updated
    })

  }

  async function saveRequirements(){

    const toastId = toast.loading("Saving requirements...")

    try{

      const { data:{ user } } = await supabase.auth.getUser()

      if(!user){
        toast.error("User not logged in",{id:toastId})
        return
      }

      const workerId = user.id

      for(const [type,file] of Object.entries(files)){

        if(!file || !file.file) continue

        const path = `${workerId}/${type}-${Date.now()}-${file.name}`

        /* Upload to storage */

        const { error:uploadError } = await supabase.storage
          .from("worker_required_files")
          .upload(path,file.file)

        if(uploadError){
          toast.error(uploadError.message,{id:toastId})
          return
        }

        /* Save metadata */

        const { error:insertError } = await supabase
          .from("worker_required_files")
          .insert({
            worker_id:workerId,
            file_type:type,
            file_url:path
          })

        if(insertError){
          toast.error(insertError.message,{id:toastId})
          return
        }

      }

      toast.success("Requirements saved",{id:toastId})

      setTimeout(()=>{
        router.push("/application/step-3-skills")
      },1200)

    }catch(err){

      toast.error("Unexpected error",{id:toastId})

    }

  }

  return(

    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">

      <Toaster position="top-center"/>

      <div className="bg-white w-[1000px] rounded-xl shadow-xl flex overflow-hidden">

        {/* LEFT PANEL */}

        <div className="w-2/3 p-10">

          {/* STEP PROGRESS */}

          <div className="flex items-center text-sm mb-6">

            <span className="text-teal-600 font-medium">Add Resume</span>
            <div className="mx-3 w-6 h-[2px] bg-teal-500"/>

            <span className="text-teal-600 font-semibold">Professional License</span>
            <div className="mx-3 w-6 h-[2px] bg-gray-300"/>

            <span className="text-black">Skill Assessment</span>
            <div className="mx-3 w-6 h-[2px] bg-gray-300"/>

            <span className="text-black">Authorizations & Documents</span>
            <div className="mx-3 w-6 h-[2px] bg-gray-300"/>

            <span className="text-black">Add References</span>
            <div className="mx-3 w-6 h-[2px] bg-gray-300"/>

            <span className="text-black">Summary</span>

          </div>

          {/* HEADER */}

          <div className="flex justify-between mb-6">

            <h2 className="text-lg font-semibold text-black">
              Add Requirements
            </h2>

            <button
              onClick={()=>router.push("/application/step-3-skills")}
              className="text-teal-600 text-sm"
            >
              Skip for Now →
            </button>

          </div>

          {/* FILES */}

          <div className="space-y-4">

            <div>
              <p className="text-sm text-black mb-2">Nursing License</p>
              <FileRow file={files.license} type="license" removeFile={removeFile}/>
            </div>

            <div>
              <p className="text-sm text-black mb-2">TB Test</p>
              <FileRow file={files.tb} type="tb" removeFile={removeFile}/>
            </div>

            <div>
              <p className="text-sm text-black mb-2">CPR Certifications</p>
              <FileRow file={files.cpr} type="cpr" removeFile={removeFile}/>
            </div>

          </div>

          <p className="text-xs text-black mt-4 mb-6">
            Only support png, jpg or pdf files
          </p>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3">

            <button
              onClick={()=>router.back()}
              className="border px-4 py-2 rounded text-black"
            >
              Back
            </button>

            <button
              onClick={saveRequirements}
              className="bg-teal-600 text-white px-6 py-2 rounded"
            >
              Save & Continue
            </button>

          </div>

        </div>

        {/* RIGHT PANEL */}

        <div className="w-1/3 bg-gray-100 relative flex items-center justify-center">

          <img
            src="/images/nurse.jpg"
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />

          <div className="z-10 text-center px-6">

            <h2 className="text-2xl font-bold text-teal-700">
              NEXUS
            </h2>

            <div className="w-10 h-[2px] bg-teal-500 mx-auto my-3"/>

            <p className="text-sm text-black">
              Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
            </p>

          </div>

        </div>

      </div>

    </div>

  )

}