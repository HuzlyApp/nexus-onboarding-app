// app/page.tsx   (or app/(landing)/page.tsx)
"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl min-h-[420px]">
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
            className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-8 py-3 rounded-xl transition shadow-sm focus:outline-none focus:ring-4 focus:ring-teal-300 w-full md:w-auto"
          >
            Start Application
          </button>

          <div className="mt-6 text-xs text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-700 font-medium hover:underline">
              Sign In
            </Link>
          </div>
        </div>

        {/* RIGHT - Image with overlay & logo */}
        <div className="relative w-full md:w-1/2 h-80 md:h-auto">
          <Image
            src="/images/n3.jpg"
            alt="Nurse"
            fill
            className="object-cover grayscale"
            priority
          />

          {/* Semi-transparent white overlay */}
          <div className="absolute inset-0 bg-white/70" />

          {/* Centered Nexus logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center text-center px-8">
              <Image
                src="/images/nexus-logo.png"
                alt="Nexus MedPro Logo"
                width={220}
                height={80}
                className="w-52 md:w-60 h-auto"
                priority
              />
              <div className="mt-6 h-px w-56 bg-zinc-300" />
              <div className="mt-4 text-xs text-zinc-700 max-w-xs">
                Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}