"use client"

import { useState } from "react"

type Item = {
  label: string
  status: "pending" | "completed" | "rejected"
}

type Section = {
  title: string
  items: Item[]
}

export default function ChecklistPage() {

  const [sections] = useState<Section[]>([
    {
      title: "Claims & Assigned Facilities",
      items: [
        { label: "Facility Assigned", status: "pending" },
        { label: "Assigned Rate", status: "pending" },
        { label: "Verified Documents", status: "completed" },
        { label: "TB Test", status: "completed" },
        { label: "CPR Certifications", status: "pending" },
      ],
    },
    {
      title: "Initial Screening / Interview",
      items: [
        { label: "Call 1", status: "completed" },
        { label: "Call 2", status: "rejected" },
      ],
    },
    {
      title: "Pre-employment Compliance Screening",
      items: [
        { label: "ID Verification", status: "pending" },
        { label: "Background Check", status: "pending" },
        { label: "Drug Test", status: "pending" },
      ],
    },
    {
      title: "Facility Specific Requirements",
      items: [
        { label: "Facility Approval", status: "pending" },
        { label: "Score Statement", status: "pending" },
      ],
    },
    {
      title: "New Hire Agreement",
      items: [
        { label: "Employee Agreement", status: "completed" },
        { label: "Create Work Record", status: "completed" },
        { label: "When/Work Account", status: "pending" },
        { label: "Paychex Account", status: "pending" },
      ],
    },
    {
      title: "Final Onboarding Steps",
      items: [
        { label: "Welcome Email Sent", status: "pending" },
        { label: "Badge Sent", status: "pending" },
        { label: "Job Offer", status: "pending" },
        { label: "Final Onboarding Call", status: "pending" },
      ],
    },
  ])

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">

      {/* SIDEBAR */}
      <div className="w-[80px] bg-[#0B3D3B] flex flex-col items-center py-6 gap-6">
        <div className="w-10 h-10 bg-white rounded-full" />
        <div className="w-8 h-8 bg-white/20 rounded" />
        <div className="w-8 h-8 bg-white/20 rounded" />
        <div className="mt-auto w-8 h-8 bg-white/20 rounded" />
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">

        {/* HEADER */}
        <div className="bg-white rounded-xl p-4 flex justify-between items-center mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center">
              J
            </div>
            <div>
              <p className="font-semibold text-black">John Doe</p>
              <p className="text-xs text-gray-500">
                Licensed Practical Nurse, LPN
              </p>
            </div>
          </div>

          <button className="border px-3 py-1 rounded text-sm">
            New Applicant
          </button>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm flex gap-6 text-sm">
          <span className="text-gray-400">Checklist</span>
          <span className="text-gray-400">Profile</span>
          <span className="text-gray-400">Attachments</span>
          <span className="text-gray-400">Skill Assessments</span>
          <span className="text-gray-400">Authorization</span>
          <span className="text-gray-400">Activities</span>
          <span className="text-gray-400">Facility Assignments</span>
          <span className="text-gray-400">History</span>
        </div>

        {/* PROGRESS */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-black font-medium">
              Progress Checklist Tracker
            </span>
            <span className="text-gray-500">15%</span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-500 rounded-full w-[15%]" />
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-6">

          {sections.map((section, idx) => (

            <div
              key={idx}
              className="bg-white rounded-xl p-5 shadow-sm"
            >

              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-black text-sm">
                  {section.title}
                </h3>

                <button className="text-xs border px-2 py-1 rounded">
                  Details
                </button>
              </div>

              <div className="space-y-3">

                {section.items.map((item, i) => (

                  <div
                    key={i}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-black">
                      {item.label}
                    </span>

                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.status === "completed"
                          ? "bg-green-100 text-green-600"
                          : item.status === "rejected"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                ))}

              </div>

            </div>

          ))}

        </div>

        {/* HISTORY */}
        <div className="bg-white rounded-xl p-5 mt-6 shadow-sm">

          <h3 className="font-semibold text-black mb-4 text-sm">
            Recent History
          </h3>

          <div className="space-y-3 text-sm text-gray-600">

            <p>• New Note Added</p>
            <p>• Document Uploaded</p>
            <p>• Status Updated</p>

          </div>

        </div>

      </div>
    </div>
  )
}