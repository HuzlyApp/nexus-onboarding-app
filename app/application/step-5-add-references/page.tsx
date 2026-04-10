"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import OnboardingLayout from "@/app/components/OnboardingLayout"
import OnboardingStepper from "@/app/components/OnboardingStepper"
import { supabaseBrowser as supabase } from "@/lib/supabase-browser"

type RefState = { first: string; last: string; phone: string; email: string }

function emptyRef(): RefState {
  return { first: "", last: "", phone: "", email: "" }
}

function isFilled(r: RefState): boolean {
  return Boolean(r.first.trim() || r.last.trim() || r.phone.trim() || r.email.trim())
}

function isComplete(r: RefState): boolean {
  return Boolean(r.first.trim() && r.last.trim() && r.phone.trim() && r.email.trim())
}

function nameKey(r: RefState): string {
  return `${r.first.trim()}-${r.last.trim()}`.toLowerCase()
}

export default function ReferencesPage() {
  const router = useRouter()

  const [refs, setRefs] = useState<RefState[]>([emptyRef(), emptyRef(), emptyRef()])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function update(index: number, field: keyof RefState, value: string) {
    setRefs((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const duplicates = useMemo(() => {
    const keys = refs
      .map((r) => nameKey(r))
      .filter((k) => k !== "-" && k !== "")
    const set = new Set(keys)
    return set.size !== keys.length
  }, [refs])

  const canSubmit = useMemo(() => {
    const [r1, r2, r3] = refs
    if (!r1 || !r2 || !r3) return false
    if (!isComplete(r1) || !isComplete(r2)) return false
    if (isFilled(r3) && !isComplete(r3)) return false
    if (duplicates) return false
    return !saving
  }, [duplicates, refs, saving])

  async function saveReferences() {
    setError(null)
    if (duplicates) {
      setError("Duplicate reference names are not allowed.")
      return
    }

    const [r1, r2, r3] = refs
    if (!r1 || !r2) {
      setError("Please add at least two references.")
      return
    }
    if (!isComplete(r1) || !isComplete(r2) || (isFilled(r3) && !isComplete(r3))) {
      setError("Please fill all required fields.")
      return
    }

    setSaving(true)
    try {
      const { data: userData, error: authErr } = await supabase.auth.getUser()
      const user = userData?.user
      if (authErr || !user) throw new Error("Please sign in to save your references.")

      const applicantId = user.id

      const { data: worker, error: wErr } = await supabase
        .from("worker")
        .select("id")
        .eq("user_id", applicantId)
        .maybeSingle()

      if (wErr) throw new Error(wErr.message || "Could not load worker profile.")
      if (!worker?.id) throw new Error("Worker profile not found. Please complete Step 1 first.")

      const workerId = worker.id as string

      const payload = refs
        .filter((r, idx) => idx < 2 || isFilled(r))
        .map((r) => ({
          worker_id: workerId,
          reference_first_name: r.first.trim(),
          reference_last_name: r.last.trim(),
          reference_phone: r.phone.trim() || null,
          reference_email: r.email.trim(),
        }))

      // Replace existing references for this applicant.
      const del = await supabase.from("worker_references").delete().eq("worker_id", workerId)
      if (del.error) throw new Error(del.error.message || "Could not update references.")

      const ins = await supabase.from("worker_references").insert(payload)
      if (ins.error) throw new Error(ins.error.message || "Could not save references.")

      router.push("/application/step-6-summary")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <OnboardingLayout>
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={() => router.push("/application/step-6-summary")}
          className="text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          Skip for Now &gt;
        </button>
      </div>

      <OnboardingStepper currentStep={5} />

      <h1 className="text-xl sm:text-2xl font-semibold text-black mb-1">Add References</h1>
      <p className="text-sm text-gray-700 mb-6">Trusted feedback, verified integrity.</p>

      <div className="space-y-8">
        {refs.map((r, index) => {
          const isOptional = index === 2
          return (
            <div key={index}>
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">Reference {index + 1}</p>
                {isOptional && <span className="text-xs text-gray-400">Optional</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">First Name</label>
                  <input
                    value={r.first}
                    onChange={(e) => update(index, "first", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    placeholder="James"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Last Name</label>
                  <input
                    value={r.last}
                    onChange={(e) => update(index, "last", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    placeholder="Right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Phone</label>
                  <input
                    value={r.phone}
                    onChange={(e) => update(index, "phone", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    placeholder="+1-800-512-2366"
                    inputMode="tel"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Email</label>
                  <input
                    value={r.email}
                    onChange={(e) => update(index, "email", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
                    placeholder="name@email.com"
                    inputMode="email"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {duplicates && <p className="mt-4 text-sm text-red-600">Duplicate reference names are not allowed.</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="flex justify-end mt-10">
        <button
          type="button"
          onClick={() => void saveReferences()}
          disabled={!canSubmit}
          className={`px-6 py-2.5 min-w-[160px] rounded-lg text-white font-medium transition ${
            !canSubmit ? "bg-gray-400 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 shadow-sm"
          }`}
        >
          {saving ? "Saving…" : "Save & Continue"}
        </button>
      </div>
    </OnboardingLayout>
  )
}

