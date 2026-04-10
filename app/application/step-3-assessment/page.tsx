"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Check, ChevronRight } from "lucide-react"
import { supabaseBrowser as supabase } from "@/lib/supabase-browser"
import OnboardingStepper from "@/app/components/OnboardingStepper"

type Category = {
  id: string
  title: string
  description: string | null
  order_number: number | null
  slug: string | null
}

/** If `slug` is null, map legacy `order_number` to existing static quiz routes. */
const LEGACY_ORDER_TO_SLUG: Record<number, string> = {
  1: "basic-care",
  2: "mobility",
  3: "clinical",
  4: "monitoring",
  5: "documentation",
}

/** Same slug as `skill_assessments.category` and the `/step-3-quiz/[slug]` route */
function categoryQuizSlug(cat: Category): string | null {
  const s = cat.slug?.trim()
  if (s) return s
  if (cat.order_number != null && LEGACY_ORDER_TO_SLUG[cat.order_number]) {
    return LEGACY_ORDER_TO_SLUG[cat.order_number]
  }
  return null
}

function quizHref(cat: Category): string | null {
  const slug = categoryQuizSlug(cat)
  if (!slug) return null
  return `/application/step-3-quiz/${encodeURIComponent(slug)}`
}

function recordCompletedCategories(rows: { category: string }[]): Set<string> {
  const set = new Set<string>()
  for (const r of rows) {
    set.add(r.category)
    if (r.category === "basic_care") set.add("basic-care")
  }
  return set
}

export default function AssessmentPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    setLoadError(null)
    setLoading(true)
    const { data, error } = await supabase
      .from("skill_categories")
      .select("id, title, description, order_number, slug")
      .order("order_number", { ascending: true, nullsFirst: false })

    if (error) {
      console.error("[step-3-assessment] skill_categories", error)
      setLoadError(error.message)
      setCategories([])
      setCompletedSlugs(new Set())
    } else {
      setCategories((data ?? []) as Category[])
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        setCompletedSlugs(new Set())
      } else {
        const { data: worker } = await supabase
          .from("worker")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()
        const workerId = worker?.id ? String(worker.id) : user.id

        const { data: doneRows, error: aErr } = await supabase
          .from("skill_assessments")
          .select("category")
          // Support both legacy rows (worker_id=user.id) and current rows (worker_id=worker.id)
          .in("worker_id", [workerId, user.id])
          .eq("completed", true)

        if (aErr) {
          console.error("[step-3-assessment] skill_assessments", aErr)
          setCompletedSlugs(new Set())
        } else {
          setCompletedSlugs(recordCompletedCategories(doneRows ?? []))
        }
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const goToCategory = (cat: Category) => {
    const href = quizHref(cat)
    if (href) router.push(href)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-600 text-white">
        <p className="text-sm">Loading categories…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-teal-600 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-[1100px] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-[62%] p-6 md:p-10 flex flex-col min-h-0">
          <OnboardingStepper currentStep={3} />

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skill Assessment Quiz</h1>
              <p className="text-gray-500 text-sm mt-1">Identify strengths. Verify readiness.</p>
            </div>
            <Link
              href="/application/step-4-documents"
              className="text-sm font-medium text-teal-700 hover:text-teal-900 shrink-0 self-start sm:self-auto"
            >
              Skip for Now &gt;
            </Link>
          </div>

          {loadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-medium">Could not load categories</p>
              <p className="mt-1">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadCategories()}
                className="mt-2 text-red-900 underline font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {!loadError && categories.length === 0 && (
            <p className="text-sm text-gray-600 mb-6">
              No skill categories are configured yet. You can continue to the next step or add rows in{" "}
              <code className="text-xs bg-gray-100 px-1 rounded">skill_categories</code>.
            </p>
          )}

          <div className="space-y-4 flex-1">
            {categories.map((cat, index) => {
              const href = quizHref(cat)
              const slug = categoryQuizSlug(cat)
              const isDone = Boolean(slug && completedSlugs.has(slug))
              const disabled = !href
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => goToCategory(cat)}
                  className={`w-full text-left flex items-center justify-between border rounded-md px-4 py-3 transition ${
                    disabled
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-70"
                      : isDone
                        ? "border-teal-200 bg-teal-50 cursor-pointer hover:bg-teal-50/70"
                        : "border-teal-200 bg-white cursor-pointer hover:bg-teal-50/50"
                  }`}
                >
                  <div className="flex gap-4 min-w-0">
                    <div
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${
                        isDone
                          ? "bg-teal-600 text-white"
                          : "border border-teal-500 text-teal-600"
                      }`}
                      aria-hidden
                    >
                      {isDone ? (
                        <Check className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900 leading-snug">{cat.title}</h2>
                      {cat.description ? (
                        <p className="text-xs text-gray-600 mt-0.5">{cat.description}</p>
                      ) : null}
                      {disabled ? (
                        <p className="text-xs text-amber-700 mt-1">
                          Set a <code className="bg-amber-100 px-1 rounded">slug</code> (e.g. basic-care) or{" "}
                          <code className="bg-amber-100 px-1 rounded">order_number</code> 1–5 for a default route.
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-teal-600 shrink-0 ml-2" aria-hidden />
                </button>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="border border-teal-600 text-teal-700 bg-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-teal-50 transition-colors"
            >
              Back
            </button>
            <Link
              href="/application/step-4-documents"
              className="inline-flex items-center justify-center bg-teal-600 text-white px-8 py-2.5 rounded-md text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
            >
              Save &amp; Continue
            </Link>
          </div>
        </div>

        <div className="w-full md:w-[38%] min-h-[280px] md:min-h-[520px] relative bg-gray-100">
          <Image
            src="/images/nurse.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 38vw"
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
