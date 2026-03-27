"use client"

import { useRouter } from "next/navigation"

export default function SkillAssessmentIntro() {

const router = useRouter()

return (

<div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center p-10">

<div className="bg-white w-[1000px] rounded-xl shadow-xl flex overflow-hidden text-black">

{/* LEFT SIDE */}

<div className="w-2/3 p-10 flex flex-col">

{/* STEP PROGRESS */}

<div className="flex items-center text-sm mb-10">

<span className="text-teal-600 font-medium">
Add Resume
</span>

<div className="mx-3 w-6 h-[2px] bg-teal-500"/>

<span className="text-teal-600 font-medium">
Professional License
</span>

<div className="mx-3 w-6 h-[2px] bg-teal-500"/>

<span className="text-teal-600 font-semibold">
Skill Assessment
</span>

<div className="mx-3 w-6 h-[2px] bg-gray-300"/>

<span>
Authorizations & Documents
</span>

<div className="mx-3 w-6 h-[2px] bg-gray-300"/>

<span>
Add References
</span>

<div className="mx-3 w-6 h-[2px] bg-gray-300"/>

<span>
Summary
</span>

</div>

{/* CONTENT */}

<div className="flex-1">

{/* HEADER */}

<div className="flex justify-between items-start mb-6">

<h2 className="text-2xl font-semibold">
Skill Assessment Quiz
</h2>

<button
onClick={() => router.push("/application/step-3-assessment")}
className="text-teal-600 text-sm"
>
Skip for Now →
</button>

</div>

{/* DESCRIPTION */}

<p className="text-sm leading-relaxed mb-8">

This checklist is meant to serve as a general guideline for our client
facilities as to the level of your skills within your nursing specialty.
Please use the scale below to describe your experience/expertise in
each area listed below.

</p>

{/* SCALE TITLE */}

<p className="font-semibold mb-4">
Proficiency Scale:
</p>

{/* SCALE */}

<div className="space-y-6 text-sm">

{/* LEVEL 1 */}

<div className="flex gap-6">

<div className="w-4 font-semibold">
1
</div>

<div>

<p className="text-teal-600 font-medium">
No Experience
</p>

<p>
Theory or observation only during the past 12 months.
</p>

</div>

</div>

{/* LEVEL 2 */}

<div className="flex gap-6 border border-blue-400 bg-blue-50 rounded-lg p-4">

<div className="w-4 font-semibold">
2
</div>

<div>

<p className="text-teal-600 font-medium">
Limited Experience
</p>

<p>
Performed less than 12 times within the past 12 months and may need a review.
</p>

</div>

</div>

{/* LEVEL 3 */}

<div className="flex gap-6">

<div className="w-4 font-semibold">
3
</div>

<div>

<p className="text-teal-600 font-medium">
Experienced
</p>

<p>
Performed at least once per month within the past 12 months and may need minimal assistance.
</p>

</div>

</div>

{/* LEVEL 4 */}

<div className="flex gap-6">

<div className="w-4 font-semibold">
4
</div>

<div>

<p className="text-teal-600 font-medium">
Highly Skilled
</p>

<p>
Performed on at least a weekly basis over the past 12 months; proficient.
</p>

</div>

</div>

</div>

</div>

{/* BUTTONS */}

<div className="flex justify-end gap-4 mt-10">

<button
onClick={() => router.back()}
className="border border-gray-400 px-5 py-2 rounded-md"
>
Back
</button>

<button
onClick={() => router.push("/application/step-3-assessment")}
className="bg-teal-600 text-white px-6 py-2 rounded-md"
>
Start Skill Assessment
</button>

</div>

</div>

{/* RIGHT PANEL */}

<div className="w-1/3 bg-gray-100 relative flex items-center justify-center">

<img
src="/images/nurse.jpg"
className="absolute inset-0 w-full h-full object-cover opacity-30"
/>

<div className="z-10 text-center px-8">

<h2 className="text-2xl font-bold text-teal-700">
NEXUS
</h2>

<div className="w-10 h-[2px] bg-teal-500 mx-auto my-3"/>

<p className="text-sm">
Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
</p>

</div>

</div>

</div>

</div>

)
}