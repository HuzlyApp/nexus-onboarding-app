"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ParsedResume {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address1?: string
  city?: string
  state?: string
  job_role?: string
  // You can extend this interface later (skills, experience, etc.)
}

export default function Step1Upload() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const parseResume = async () => {
    if (!file) {
      setError("Please select a resume file first.")
      return
    }

    setParsing(true)
    setError(null)

    try {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      const arrayBuffer = await file.arrayBuffer()

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ""

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()

        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")

        fullText += pageText + "\n"
      }

      // Clean up text into lines
      const lines = fullText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)

      const parsed: ParsedResume = {}

      // ── Very basic name heuristic ──
      if (lines.length > 0 && lines[0].includes(" ")) {
        const [first, ...rest] = lines[0].split(/\s+/)
        parsed.first_name = first.trim()
        parsed.last_name = rest.join(" ").trim()
      }

      // ── Email ──
      const emailRegex = /[\w\.-]+@[\w\.-]+\.\w{2,}/gi
      const emailMatch = fullText.match(emailRegex)
      if (emailMatch?.length) {
        parsed.email = emailMatch[0].toLowerCase()
      }

      // ── Phone (improved pattern) ──
      const phoneRegex =
        /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})/gi
      const phoneMatch = fullText.match(phoneRegex)
      if (phoneMatch?.length) {
        parsed.phone = phoneMatch[0].replace(/\D/g, "")
      }

      // ── Address (very basic – improve later) ──
      const addressRegex = /([\w\s#/-]+?,\s*[\w\s]+(?:,\s*[A-Z]{2})?\s*\d{5}(?:-\d{4})?)/i
      const addrMatch = fullText.match(addressRegex)
      if (addrMatch?.[1]) {
        const parts = addrMatch[1]
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)

        if (parts.length >= 2) {
          parsed.address1 = parts[0]
          parsed.city = parts[1]

          const last = parts[parts.length - 1]
          const stateMatch = last.match(/[A-Z]{2}/)
          if (stateMatch) {
            parsed.state = stateMatch[0]
          }
        }
      }

      // ── Job role heuristic ──
      const commonRoles = ["CNA", "RN", "LVN", "LPN", "Medical Assistant", "Caregiver", "Nurse", "Registered Nurse"]
      for (const line of lines.slice(0, 25)) {
        const upper = line.toUpperCase()
        const match = commonRoles.find((r) => upper.includes(r))
        if (match) {
          parsed.job_role = match
          break
        }
      }

      // Save parsed data for the review step
      localStorage.setItem("parsedResume", JSON.stringify(parsed))

      // Go to review page
      router.push("/application/step-1-review")
    } catch (err: unknown) {
      console.error("Resume parsing failed:", err)
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to parse resume: ${message}`)
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Upload Your Resume
        </h1>
        <p className="text-gray-600 text-center mb-8">
          PDF format • We'll extract key information for you to review
        </p>

        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-3">
            Select Resume (PDF)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg">
            {error}
          </div>
        )}

        <button
          onClick={parseResume}
          disabled={!file || parsing}
          className={`w-full py-4 px-6 rounded-xl text-white font-semibold transition-all ${
            !file || parsing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg"
          }`}
        >
          {parsing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
              Parsing...
            </span>
          ) : (
            "Parse Resume & Continue"
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          You can edit all extracted information on the next screen.
        </p>
      </div>
    </div>
  )
}