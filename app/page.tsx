// app/page.tsx   (or app/(landing)/page.tsx)
"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl">
        {/* LEFT - Text & Button */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <h1 className="text-4xl md:text-4xl font-bold text-gray-800 mb-4">
            Join Nexus MedPro
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-10">
            Quick pay, flexible shifts, support team
          </p>

          <button
            onClick={() => router.push("/application/step-1-upload")}
            className="bg-teal-600 hover:bg-teal-700 text-white text-lg font-medium px-10 py-4 rounded-xl transition shadow-md focus:outline-none focus:ring-4 focus:ring-teal-300 w-full md:w-auto"
          >
            Start Application
          </button>
        </div>

        {/* RIGHT - Image with overlay & logo */}
        <div className="relative w-full md:w-1/2 h-80 md:h-auto">
          <Image
            src="/images/nurse.jpg"
            alt="Nurse"
            fill
            className="object-cover grayscale"
            priority
          />

          {/* Semi-transparent white overlay */}
          <div className="absolute inset-0 bg-white/70" />

          {/* Centered Nexus logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/images/nexus-logo.png"
              alt="Nexus MedPro Logo"
              width={220}
              height={80}
              className="w-48 md:w-56 h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}