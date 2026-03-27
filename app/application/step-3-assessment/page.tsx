"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import OnboardingStepper from "@/app/components/OnboardingStepper"


interface Category {
 id: string
 title: string
 description: string
 order_number: number
}

export default function AssessmentPage() {

 const router = useRouter()

 const [categories,setCategories] = useState<Category[]>([])
 const [loading,setLoading] = useState(true)

 useEffect(()=>{

  const loadCategories = async()=>{

   const {data,error} = await supabase
    .from("skill_categories")
    .select("*")
    .order("order_number",{ascending:true})

   if(error) console.error(error)

   if(data) setCategories(data)

   setLoading(false)
  }

  loadCategories()

 },[])

 const goToCategory = (order:number)=>{

  if(order===1) router.push("/application/step-3-quiz/basic-care")
  if(order===2) router.push("/application/step-3-quiz/mobility")
  if(order===3) router.push("/application/step-3-quiz/clinical")
  if(order===4) router.push("/application/step-3-quiz/monitoring")
  if(order===5) router.push("/application/step-3-quiz/documentation")

 }

 if(loading){
  return(
   <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
    Loading Skills...
   </div>
  )
 }

 return(

 <div className="min-h-screen bg-gradient-to-r from-teal-400 to-emerald-500 flex items-center justify-center p-12">

 <div className="bg-white w-[1280px] rounded-2xl shadow-2xl flex overflow-hidden">

 {/* LEFT PANEL */}

 <div className="w-2/3 p-10">
<OnboardingStepper currentStep={3} />
 {/* STEP PROGRESS */}

 <div className="flex items-center justify-between mb-10 text-sm text-gray-500">

 <div className="flex items-center gap-2 text-teal-600 font-medium">
 <div className="w-7 h-7 rounded-full border-2 border-teal-600 flex items-center justify-center text-xs">
 1
 </div>
 Add Resume
 </div>

 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full border flex items-center justify-center text-xs">
 2
 </div>
 Professional License
 </div>

 <div className="flex items-center gap-2 text-teal-600 font-medium">
 <div className="w-7 h-7 rounded-full border-2 border-teal-600 flex items-center justify-center text-xs">
 3
 </div>
 Skill Assessment
 </div>

 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full border flex items-center justify-center text-xs">
 4
 </div>
 Authorizations
 </div>

 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full border flex items-center justify-center text-xs">
 5
 </div>
 Add References
 </div>

 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-full border flex items-center justify-center text-xs">
 6
 </div>
 Summary
 </div>

 </div>

 {/* TITLE */}

 <div className="flex justify-between items-center mb-6">

 <div>

 <h1 className="text-2xl font-bold text-gray-800">
 Skill Assessment Quiz
 </h1>

 <p className="text-gray-500 text-sm">
 Identify Strengths. Verify Readiness.
 </p>

 </div>

 <button className="text-teal-600 text-sm font-medium">
 Skip for Now →
 </button>

 </div>

 {/* CATEGORY LIST */}

 <div className="space-y-4">

 {categories.map((cat,index)=>(

 <div
 key={cat.id}
 onClick={()=>goToCategory(cat.order_number)}
 className="flex items-center justify-between border border-teal-400 rounded-lg p-5 cursor-pointer hover:bg-teal-50 transition"
 >

 <div className="flex gap-4">

 <div className="w-9 h-9 rounded-full border border-teal-500 flex items-center justify-center text-teal-600 font-semibold">
 {index+1}
 </div>

 <div>

 <h2 className="font-semibold text-gray-800">
 {cat.title}
 </h2>

 <p className="text-sm text-gray-500">
 {cat.description}
 </p>

 </div>

 </div>

 <span className="text-teal-500 text-xl">
 →
 </span>

 </div>

 ))}

 </div>

 {/* FOOTER */}

 <div className="flex justify-end gap-4 mt-10">

 <button
 onClick={()=>router.back()}
 className="border px-6 py-2 rounded-md text-gray-600"
 >
 Back
 </button>

 <button
 onClick={()=>router.push("/application/step-4-documents")}
 className="bg-teal-600 text-white px-8 py-2 rounded-md"
 >
 Save & Continue
 </button>

 </div>

 </div>

 {/* RIGHT PANEL */}

 <div className="w-[360px] relative bg-gray-100">

 <Image
 src="/images/nurse.jpg"
 alt="Nurse"
 fill
 className="object-cover grayscale"
 />

 <div className="absolute inset-0 bg-white/60"/>

 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">

 <Image
 src="/images/nexus-logo.png"
 alt="logo"
 width={140}
 height={50}
 className="mb-4"
 />

 <p className="text-gray-700 text-sm leading-relaxed">
 Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
 </p>

 </div>

 </div>

 </div>

 </div>

 )
}