"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Trash2, FileText } from "lucide-react"
import OnboardingStepper from "@/app/components/OnboardingStepper"


type UploadFile = {
  name: string
  size: string
}

type UploadType = "license" | "tb" | "cpr"

export default function Step2License() {

const router = useRouter()

const [files, setFiles] = useState<{
license: UploadFile | null
tb: UploadFile | null
cpr: UploadFile | null
}>({
license:null,
tb:null,
cpr:null
})

const handleUpload = (file:File,type:UploadType)=>{

setFiles((prev)=>({
...prev,
[type]:{
name:file.name,
size:(file.size/1024/1024).toFixed(1)+" MB"
}
}))

}

const UploadBox = ({
type,
label
}:{type:UploadType,label:string})=>{

const onDrop = (acceptedFiles:File[])=>{
if(!acceptedFiles[0]) return
handleUpload(acceptedFiles[0],type)
}

const {getRootProps,getInputProps} = useDropzone({
onDrop,
accept:{
"image/*":[],
"application/pdf":[]
}
})

const file = files[type]

return(

<div className="mb-6">

<p className="text-sm text-black mb-2">
{label}
</p>

{file ? (

<div className="border border-teal-300 bg-teal-50 rounded-lg px-4 py-3 flex items-center justify-between">

<div className="flex items-center gap-3">

<FileText className="text-teal-600"/>

<div>

<p className="text-sm font-medium text-black">
{file.name}
</p>

<p className="text-xs text-black">
{file.size}
</p>

</div>

</div>

<button
onClick={()=>setFiles(prev=>({...prev,[type]:null}))}
>
<Trash2 size={18}/>
</button>

</div>

):( 

<div
{...getRootProps()}
className="border-2 border-dashed border-teal-300 rounded-lg p-8 text-center cursor-pointer"
>

<input {...getInputProps()} />

<div className="flex flex-col items-center gap-2">

<FileText className="text-teal-600"/>

<p className="text-sm text-black">
Drag your file(s) to start uploading
</p>

<button className="border px-4 py-1 rounded text-sm text-black">
Browse files
</button>

<p className="text-xs text-black">
Max 10 MB files are allowed
</p>

</div>

</div>

)}

</div>

)

}

const goNext = () => {

/* pass data to next page */

localStorage.setItem(
"step2_files",
JSON.stringify(files)
)

router.push("/application/step-2-review-req")

}

return(

<div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">

{/* MAIN CARD */}

<div className="bg-white w-[1000px] rounded-xl shadow-xl flex overflow-hidden">

{/* LEFT CONTENT */}

<div className="w-2/3 p-10">
<OnboardingStepper currentStep={2} />

{/* STEP PROGRESS */}

<div className="flex items-center text-sm mb-6">

<span className="text-teal-600 font-medium">
Add Resume
</span>

<div className="mx-3 h-[2px] w-6 bg-teal-500"/>

<span className="text-teal-600 font-semibold">
Professional License
</span>

<div className="mx-3 h-[2px] w-6 bg-gray-300"/>

<span className="text-black">
Skill Assessment
</span>

<div className="mx-3 h-[2px] w-6 bg-gray-300"/>

<span className="text-black">
Authorizations & Documents
</span>

<div className="mx-3 h-[2px] w-6 bg-gray-300"/>

<span className="text-black">
Add References
</span>

<div className="mx-3 h-[2px] w-6 bg-gray-300"/>

<span className="text-black">
Summary
</span>

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

{/* FILE UPLOADS */}

<UploadBox
type="license"
label="Nursing License"
/>

<UploadBox
type="tb"
label="TB Test"
/>

<UploadBox
type="cpr"
label="CPR Certifications"
/>

<p className="text-xs text-black mb-6">
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
onClick={goNext}
className="bg-teal-600 text-white px-6 py-2 rounded"
>
Next
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