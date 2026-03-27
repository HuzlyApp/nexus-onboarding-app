"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MobilityQuiz() {
  const router = useRouter()

  const QUESTIONS = [
    "Ambulation (includes crutch walking)",
    "Patient transfer and transport",
    "Body systems review (head-to-toe data collection)",
    "Cast care and traction",
    "Application of heat and cold",
    "Pre-op and post-op care",
    "Surgical preps",
    "Bandaging and dressing",
  ]

  const [page, setPage] = useState(1)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)

  const start = (page - 1) * 3
  const end = start + 5
  const pageQuestions = QUESTIONS.slice(start, end)

  function selectAnswer(index: number, value: number) {
    setAnswers((prev) => ({ ...prev, [index]: value }))
  }

  function isComplete() {
    for (let i = start; i < end; i++) {
      if (!answers[i]) return false
    }
    return true
  }

  // ✅ LOAD EXISTING ANSWERS
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      const user = data?.user

      if (!user) return

      const { data: existing } = await supabase
        .from("skill_assessments")
        .select("answers")
        .eq("user_id", user.id)
        .eq("category", "mobility")
        .maybeSingle()

      if (existing?.answers) {
        setAnswers(existing.answers)
      }
    }

    load()
  }, [])

  // ✅ FINAL CLEAN SAVE FUNCTION (NO ERRORS)
  async function save() {
    setSaving(true)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError || !userData?.user) {
        console.error("AUTH ERROR:", userError)
        alert("User not authenticated")
        return
      }

      const user = userData.user

      const cleanAnswers = JSON.parse(JSON.stringify(answers))

      const { data, error } = await supabase
        .from("skill_assessments")
        .upsert({
          user_id: user.id,
          category: "mobility",
          answers: cleanAnswers,
        })
        .select()

      if (error) {
        console.error("DB ERROR:", error)
        alert(error.message)
        return
      }

      console.log("Saved successfully:", data)
      localStorage.setItem("mobility", "true")
    } catch (e) {
      console.error("SAVE ERROR:", e)
    } finally {
      setSaving(false)
      router.push("/application/step-3-assessment")
    }
  }

  function next() {
    if (!isComplete()) {
      alert("Please answer all questions")
      return
    }

    if (page === 2) {
      save()
      return
    }

    setPage(page + 1)
  }

  function back() {
    if (page > 1) setPage(page - 1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-400 to-emerald-500">
      <div className="w-[1100px] bg-white rounded-xl shadow-xl flex">

        {/* LEFT */}
        <div className="flex-1 p-10">
          <h2 className="text-2xl font-bold text-black mb-2">
           Mobility, Positioning & Patient Handling
          </h2>

          <p className="text-black mb-6">Answer the following questions</p>

          <div className="space-y-6">
            {pageQuestions.map((q, i) => {
              const index = start + i

              return (
                <div
                  key={index}
                  className="flex justify-between items-center border-b pb-4"
                >
                  <div className="text-black">
                    {index + 1}. {q}
                  </div>

                  <div className="flex gap-6">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        onClick={() => selectAnswer(index, n)}
                        className={`w-5 h-5 rounded-full border cursor-pointer ${
                          answers[index] === n
                            ? "bg-teal-600 border-teal-600"
                            : "border-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* FOOTER */}
          <div className="flex justify-between mt-10">
            <span className="text-black">{page} of 2</span>

            <div className="flex gap-3">
              <button
                onClick={back}
                className="px-5 py-2 border rounded text-black"
              >
                Back
              </button>

              <button
                onClick={next}
                disabled={saving}
                className="px-6 py-2 bg-teal-600 text-white rounded"
              >
                {saving ? "Saving..." : page === 2 ? "Submit" : "Next"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-[350px] bg-gray-100 flex flex-col items-center justify-center">
          <img src="/nexus-logo.png" className="w-40 mb-4" />

          <p className="text-black text-center px-6">
            Nexus MedPro Staffing – Connecting Healthcare professionals
          </p>
        </div>
      </div>
    </div>
  )
}
