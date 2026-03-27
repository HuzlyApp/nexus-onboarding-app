"use client"

import Image from "next/image"

type Props = {
  children: React.ReactNode
}

export default function OnboardingLayout({ children }: Props) {

return (

<div className="min-h-screen bg-gradient-to-r from-teal-600 to-emerald-600 flex items-center justify-center p-6">

<div className="bg-white rounded-xl w-[1100px] max-w-full flex overflow-hidden shadow-lg">

{/* LEFT CONTENT */}

<div className="flex-1 p-10">

{children}

</div>

{/* RIGHT PANEL */}

<div className="hidden md:block w-[420px] relative">

<Image
src="/images/n1.jpg"
alt="Nurse"
fill
className="object-cover"
/>

{/* overlay */}
<div className="absolute inset-0 bg-white/70"></div>

{/* logo section */}

<div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">

<Image
src="/images/nexus-logo.png"
alt="Nexus"
width={160}
height={60}
/>

<p className="mt-6 text-gray-700 max-w-xs">
Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
</p>

</div>

</div>

</div>

</div>

)

}