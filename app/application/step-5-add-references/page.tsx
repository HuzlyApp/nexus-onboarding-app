"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import OnboardingStepper from "@/app/components/OnboardingStepper"

export default function ReferencesPage(){

const router=useRouter()

const [refs,setRefs]=useState([
{first:"",last:"",phone:"",email:""}
])

const [error,setError]=useState("")

function update(index:number,field:string,value:string){

const updated=[...refs]

updated[index]={
...updated[index],
[field]:value
}

setRefs(updated)

}

function addReference(){

if(refs.length>=3) return

setRefs([
...refs,
{first:"",last:"",phone:"",email:""}
])

}

function hasDuplicateNames(){

const names=refs
.map(r=>`${r.first}-${r.last}`.toLowerCase())
.filter(n=>n!="-")

const set=new Set(names)

return set.size!==names.length

}

async function saveReferences(){

setError("")

if(hasDuplicateNames()){
setError("Duplicate reference names are not allowed.")
return
}

for(const r of refs){

if(!r.first || !r.last || !r.phone || !r.email){
setError("Please fill all required fields.")
return
}

}

const {error}=await supabase
.from("worker_references")
.insert(
refs.map(r=>({
first_name:r.first,
last_name:r.last,
phone:r.phone,
email:r.email
}))
)

if(error){
setError(error.message)
return
}

router.push("/application/step-6-summary")

}

return(

<div className="min-h-screen bg-gradient-to-r from-teal-400 to-emerald-500 flex items-center justify-center p-10">

<div className="bg-white rounded-xl shadow-xl w-[1060px] flex overflow-hidden">

{/* LEFT PANEL */}

<div className="w-2/3 p-8 text-black">

<OnboardingStepper currentStep={5} />

{/* TITLE */}

<div className="flex justify-between mb-6">

<div>

<h1 className="text-xl font-semibold">
Add References
</h1>

<p className="text-sm">
Trusted feedback, verified integrity.
</p>

<p className="text-xs text-gray-500 mt-1">
Note: You can add up to 3 references.
</p>

</div>

<button className="text-teal-600 text-sm">
Skip for Now →
</button>

</div>

{/* REFERENCES */}

<div className="space-y-8">

{refs.map((r,index)=>(

<div key={index}>

<div className="text-sm font-semibold mb-2">
Reference {index+1}
</div>

<div className="grid grid-cols-2 gap-4 mb-3">

<input
placeholder="First Name"
value={r.first}
onChange={(e)=>update(index,"first",e.target.value)}
className="border rounded px-3 py-2 text-black placeholder:text-black"
/>

<input
placeholder="Last Name"
value={r.last}
onChange={(e)=>update(index,"last",e.target.value)}
className="border rounded px-3 py-2 text-black placeholder:text-black"
/>

</div>

<div className="grid grid-cols-2 gap-4">

<input
placeholder="Phone"
value={r.phone}
onChange={(e)=>update(index,"phone",e.target.value)}
className="border rounded px-3 py-2 text-black placeholder:text-black"
/>

<input
placeholder="Email"
value={r.email}
onChange={(e)=>update(index,"email",e.target.value)}
className="border rounded px-3 py-2 text-black placeholder:text-black"
/>

</div>

</div>

))}

</div>

{/* ADD BUTTON */}

{refs.length<3 &&(

<button
onClick={addReference}
className="mt-6 border px-4 py-2 rounded text-teal-600 border-teal-600"
>
+ Add Reference
</button>

)}

{/* ERROR */}

{error &&(

<div className="text-red-500 text-sm mt-4">
{error}
</div>

)}

{/* FOOTER */}

<div className="flex justify-between mt-8">

<button
onClick={()=>router.back()}
className="border px-6 py-2 rounded"
>
Back
</button>

<button
onClick={saveReferences}
className="bg-teal-600 text-white px-6 py-2 rounded"
>
Save & Continue
</button>

</div>

</div>

{/* RIGHT PANEL */}

<div className="w-1/3 bg-gray-100 flex items-center justify-center">

<div className="text-center p-6">

<img
src="/nexus-logo.png"
className="w-32 mx-auto mb-6"
/>

<p className="text-sm text-gray-600">
Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
</p>

</div>

</div>

</div>

</div>

)

}