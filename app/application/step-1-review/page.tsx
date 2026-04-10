// app/application/step-1-review/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import OnboardingStepper from "@/app/components/OnboardingStepper"

export default function Step1Review() {
  const router = useRouter()

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    jobRole: "",
    sameAsAddress1: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)   // ← for popup

  // Load parsed resume data from PDF
  useEffect(() => {
    // Ensure we always have an applicant id for saving.
    const existingApplicantId = localStorage.getItem("applicantId")
    if (!existingApplicantId) {
      const newId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `app_${Date.now()}_${Math.random().toString(16).slice(2)}`
      localStorage.setItem("applicantId", newId)
    }

    const saved = localStorage.getItem("parsedResume")
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      setForm({
        firstName: parsed.first_name || parsed.FirstName || "",
        lastName: parsed.last_name || parsed.LastName || "",
        address1: parsed.address1 || parsed.address || parsed.Address || "",
        address2: parsed.address2 || "",
        city: parsed.city || parsed.City || "",
        state: parsed.state || parsed.State || "",
        zipCode: parsed.zipCode || parsed.zip || "",
        phone: parsed.phone || parsed.Phone || "",
        email: parsed.email || parsed.Email || "",
        jobRole: parsed.job_role || parsed.JobRole || parsed.job_title || "",
        sameAsAddress1: false,
      })
    } catch (e) {
      console.error("Failed to parse resume data", e)
    }
  }, [])

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function describeSaveError(err: unknown): string {
    if (err instanceof Error && err.message) return err.message
    if (err && typeof err === "object") {
      const e = err as { message?: string; details?: string; hint?: string; code?: string }
      const parts = [e.message, e.details, e.hint].filter((x): x is string => Boolean(x?.trim()))
      if (parts.length) return parts.join(" — ")
      if (e.code) return `Could not save (${e.code})`
    }
    return "Failed to save data"
  }

  const handleSaveAndContinue = async () => {
    setError(null)
    setLoading(true)

    try {
      // Create a new worker record on each save by generating a fresh applicantId.
      // This prevents overwriting the previous worker row keyed by user_id.
      const applicantId = globalThis.crypto?.randomUUID?.()
      if (!applicantId) throw new Error("Could not generate applicant ID")
      localStorage.setItem("applicantId", applicantId)

      const payload = {
        applicantId,
        firstName: form.firstName,
        lastName: form.lastName,
        address1: form.address1,
        address2: form.address2,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        phone: form.phone,
        email: form.email,
        jobRole: form.jobRole,
      }

      const workerRow = {
        user_id: applicantId,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        address1: form.address1.trim(),
        address2: form.address2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zipCode.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        job_role: form.jobRole.trim(),
        updated_at: new Date().toISOString(),
      }

      const saveRes = await fetch("/api/onboarding/save-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      let saveJson: { error?: string; hint?: string } = {}
      try {
        saveJson = (await saveRes.json()) as { error?: string; hint?: string }
      } catch {
        /* non-JSON error body */
      }

      if (
        saveRes.status === 503 &&
        (saveJson.error === "MISSING_SERVICE_ROLE_KEY" || saveJson.error === "MISSING_SUPABASE_URL")
      ) {
        const { supabaseBrowser: supabase } = await import("@/lib/supabase-browser")
        // Avoid upsert(..., onConflict: "user_id") in the browser — it requires a UNIQUE constraint on worker.user_id.
        // If the DB isn't migrated, upsert will either error or insert duplicates.
        const { data: existing, error: selErr } = await supabase
          .from("worker")
          .select("id")
          .eq("user_id", applicantId)
          .maybeSingle()
        if (selErr) {
          throw new Error(
            `${describeSaveError(selErr)} To save from the server instead, add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Project Settings → API → service_role secret).`
          )
        }
        if (existing?.id) {
          const { user_id: _u, ...updatePayload } = workerRow as Record<string, unknown>
          const { error: upErr } = await supabase.from("worker").update(updatePayload).eq("id", existing.id)
          if (upErr) {
            throw new Error(
              `${describeSaveError(upErr)} To save from the server instead, add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Project Settings → API → service_role secret).`
            )
          }
        } else {
          const { error: insErr } = await supabase.from("worker").insert(workerRow)
          if (insErr) {
            throw new Error(
              `${describeSaveError(insErr)} To save from the server instead, add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Project Settings → API → service_role secret).`
            )
          }
        }
      } else if (!saveRes.ok) {
        throw new Error(
          saveJson.hint || saveJson.error || `Save failed (${saveRes.status})`
        )
      }

      // Save to localStorage for next steps (snake_case keys for steps that read parsedResume)
      localStorage.setItem(
        "parsedResume",
        JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          address1: form.address1,
          address2: form.address2,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          phone: form.phone,
          email: form.email,
          job_role: form.jobRole,
          firstName: form.firstName,
          lastName: form.lastName,
          jobRole: form.jobRole,
        })
      )

      // Show success popup
      setSuccess(true)

      // Auto go to next page after showing popup
      setTimeout(() => {
        router.push("/application/step-2-license")
      }, 1200)

    } catch (err: unknown) {
      const message = describeSaveError(err)
      console.error("Save worker failed:", err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl flex flex-col md:flex-row min-h-[540px]">

        {/* LEFT - Form */}
        <div className="w-full md:w-2/3 p-8 md:p-10">
          <OnboardingStepper currentStep={1} />

          <h2 className="text-2xl font-semibold text-black mb-6">
            Review resume details
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">First Name</label>
                <input
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Last Name</label>
                <input
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black"
                  placeholder="Last Name"
                />
              </div>
            </div>

            {/* Address 1 */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">Address 1</label>
              <input
                value={form.address1}
                onChange={(e) => handleChange("address1", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black"
                placeholder="1234 Main St, Apt 4B"
              />
            </div>

            {/* Same as Address 1 */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sameAsAddress1}
                onChange={(e) => handleChange("sameAsAddress1", e.target.checked)}
                className="w-5 h-5 accent-teal-600"
              />
              <span className="text-black font-medium">Same as address 1</span>
            </label>

            {/* Address 2 */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">Address 2</label>
              <input
                value={form.address2}
                onChange={(e) => handleChange("address2", e.target.value)}
                disabled={form.sameAsAddress1}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black
                  ${form.sameAsAddress1 ? "bg-gray-100" : ""}`}
                placeholder="Apt, Suite, Building, Floor, etc."
              />
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">City</label>
                <input
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">State</label>
                <input
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Zip Code</label>
                <input
                  value={form.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black"
                  placeholder="Zip Code"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black"
                  placeholder="Phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black"
                  placeholder="Email"
                />
              </div>
            </div>

            {/* Job Role */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">Job Role</label>
              <select
                value={form.jobRole}
                onChange={(e) => handleChange("jobRole", e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-600 focus:outline-none text-black bg-white"
              >
                <option value="">Select role</option>
                <option value="CNA">CNA</option>
                <option value="RN">RN</option>
                <option value="LVN">LVN</option>
                <option value="Medical Assistant">Medical Assistant</option>
                <option value="Caregiver">Caregiver</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-10">
            <button
              onClick={() => router.back()}
              className="px-8 py-3 border border-gray-300 text-black font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleSaveAndContinue}
              disabled={loading}
              className="px-8 py-3 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save & continue"}
            </button>
          </div>
        </div>

        {/* RIGHT - Branding */}
        <div className="hidden md:block w-1/3 relative">
          <Image src="/images/nurse.jpg" alt="nurse" fill className="object-cover grayscale" />
          <div className="absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
            <div className="flex flex-col items-center">
              <Image
                src="/images/nexus-logo.png"
                alt="Nexus MedPro Logo"
                width={220}
                height={80}
                className="w-56 h-auto"
                priority
              />
              <div className="mt-6 h-px w-56 bg-zinc-300" />
              <div className="mt-4 text-xs text-zinc-700">
                Nexus MedPro Staffing – Connecting Healthcare professionals with service providers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS POPUP */}
      {success && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-xs text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center text-4xl mb-4">
              ✅
            </div>
            <h3 className="text-2xl font-semibold text-black mb-2">Saved Successfully!</h3>
            <p className="text-gray-600 mb-6">Your information has been saved.</p>
            <button
              onClick={() => router.push("/application/step-2-license")}
              className="w-full py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700"
            >
              Continue to Next Step
            </button>
          </div>
        </div>
      )}
    </div>
  )
}