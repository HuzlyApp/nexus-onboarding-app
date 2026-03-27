"use client"

import { Check } from "lucide-react"

interface Props{
currentStep:number
}

export default function OnboardingStepper({currentStep}:Props){

const steps=[
"Add Resume",
"Professional License",
"Skill Assessment",
"Authorizations",
"Add References",
"Summary"
]

return(

<div className="relative w-full mb-10">

{/* BASE LINE */}

<div className="absolute top-4 left-0 right-0 h-[2px] bg-gray-200"/>

{/* ACTIVE LINE */}

<div
className="absolute top-4 left-0 h-[2px] bg-teal-600 transition-all"
style={{
width:`${((currentStep-1)/(steps.length-1))*100}%`
}}
/>

<div className="relative flex justify-between">

{steps.map((step,index)=>{

const stepNumber=index+1
const completed = stepNumber < currentStep
const active = stepNumber === currentStep

return(

<div key={step} className="flex flex-col items-center text-center">

{/* CIRCLE */}

<div
className={`
w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold bg-white

${completed?"bg-teal-600 text-white":""}
${active?"border-2 border-teal-600 text-teal-600":""}
${!completed && !active?"border border-gray-300 text-gray-400":""}
`}
>

{completed ? <Check size={16}/> : stepNumber}

</div>

{/* LABEL */}

<span
className={`text-sm mt-2 whitespace-nowrap

${completed || active ? "text-teal-600 font-medium" : "text-gray-400"}
`}
>

{step}

</span>

</div>

)

})}

</div>

</div>

)

}