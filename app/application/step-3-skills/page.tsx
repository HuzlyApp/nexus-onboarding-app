"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import OnboardingStepper from "@/app/components/OnboardingStepper"

const SCALE = [
  {
    n: "1",
    title: "No Experience",
    body: "Theory or observation only during the past 12 months.",
  },
  {
    n: "2",
    title: "Limited Experience",
    body: "Performed less than 12 times within the past 12 months and may need a review.",
  },
  {
    n: "3",
    title: "Experienced",
    body: "Performed at least once per month within the past 12 months and may need minimal assistance.",
  },
  {
    n: "4",
    title: "Highly Skilled",
    body: "Performed on at least a weekly basis over the past 12 months; proficient.",
  },
] as const

export default function SkillAssessmentIntro() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-teal-600 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-[1100px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-[62%] p-6 md:p-10 flex flex-col min-h-0">
          <OnboardingStepper currentStep={3} />

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Skill Assessment Quiz</h1>
            <button
              type="button"
              onClick={() => router.push("/application/step-3-assessment")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 shrink-0 self-start sm:self-auto"
            >
              Skip for Now &gt;
            </button>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-8">
            This checklist is meant to serve as a general guideline for our client facilities as to the
            level of your skills within your nursing specialty. Please use the scale below to describe your
            experience/expertise in each area listed below.
          </p>

          <p className="font-bold text-gray-900 mb-4">Proficiency Scale:</p>

          <ul className="space-y-5 text-sm text-gray-800 mb-10">
            {SCALE.map((row) => (
              <li key={row.n} className="flex gap-4">
                <span className="text-teal-600 font-bold tabular-nums shrink-0 w-5">{row.n}</span>
                <div>
                  <span className="text-teal-600 font-semibold">{row.title}:</span>{" "}
                  <span className="text-gray-700">{row.body}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-end gap-3 mt-auto pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="border-2 border-teal-600 text-teal-600 bg-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-teal-50 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => router.push("/application/step-3-assessment")}
              className="bg-teal-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
            >
              Start Skill Assessment
            </button>
          </div>
        </div>

        <div className="w-full md:w-[38%] min-h-[280px] md:min-h-[520px] relative bg-gray-100">
          <Image
            src="/images/nurse.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 38vw"
            priority
          />
          <div className="absolute inset-0 bg-white/55" aria-hidden />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 py-10">
            <Image
              src="/images/nexus-logo.png"
              alt="Nexus MedPro Staffing"
              width={160}
              height={56}
              className="mb-5 h-auto w-[min(200px,85%)]"
            />
            <p className="text-gray-800 text-sm leading-relaxed max-w-[280px]">
              Nexus MedPro Staffing - Connecting Healthcare professionals with service providers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
