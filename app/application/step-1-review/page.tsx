// app/application/step-1-review/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

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

  const handleSaveAndContinue = async () => {
    setError(null)
    setLoading(true)

    try {
      const applicantId = localStorage.getItem("applicantId")
      if (!applicantId) {
        throw new Error("No applicant ID found. Please start from the beginning.")
      }

      const { error: upsertError } = await supabase
        .from("worker_profiles")
        .upsert({
          applicant_id: applicantId,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          address1: form.address1.trim(),
          address2: form.address2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip_code: form.zipCode.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          job_role: form.jobRole.trim(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "applicant_id" })

      if (upsertError) throw upsertError

      // Save to localStorage for next steps
      localStorage.setItem("parsedResume", JSON.stringify(form))

      // Show success popup
      setSuccess(true)

      // Auto go to next page after showing popup
      setTimeout(() => {
        router.push("/application/step-2-license")
      }, 1200)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save data"
      console.error(message, err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-400 to-emerald-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-[1000px] flex flex-col lg:flex-row">

        {/* LEFT - Form */}
        <div className="flex-1 p-8 lg:p-12">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Last Name</label>
                <input
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black"
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
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">State</label>
                <input
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Zip Code</label>
                <input
                  value={form.zipCode}
                  onChange={(e) => handleChange("zipCode", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black"
                  placeholder="Phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-teal-600 focus:outline-none text-black bg-white"
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
              className="px-8 py-3 border border-gray-400 text-black font-medium rounded-xl hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleSaveAndContinue}
              disabled={loading}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save & continue"}
            </button>
          </div>
        </div>

        {/* RIGHT - Branding */}
        <div className="w-full lg:w-1/3 bg-gray-100 flex items-center justify-center p-8 lg:p-0">
          <div className="text-center">
            <div className="text-2xl font-bold text-black mb-2">NEXUS</div>
            <p className="text-sm text-gray-600">MedPro Staffing</p>
            <p className="mt-6 text-xs text-gray-500">
              Connecting Healthcare professionals with service providers
            </p>
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