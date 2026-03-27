"use client"

import { useState } from "react"

const data = Array.from({ length: 9 }).map((_, i) => ({
  id: i,
  name: ["James Doe", "Clark Johnson", "Joe Dalton"][i % 3],
  email: "jamesdoe@gmail.com",
  phone: "+1 400 180 9141",
  location: "Boston, MA",
  status: "New",
}))

export default function CandidatesPage() {

  const [view, setView] = useState<"card" | "list">("card")

  return (
    <div className="flex h-screen bg-[#F7F9FB]">

      {/* SIDEBAR */}
      <div className="w-[240px] bg-[#0F3D3E] text-white flex flex-col">

        <div className="p-6 border-b border-white/10">
          <div className="text-lg font-bold">NEXUS</div>
        </div>

        <div className="p-4 text-xs text-white/60">TEAM MANAGEMENT</div>

        <div className="px-3 space-y-2">

          <SidebarItem active label="Candidates" />
          <SidebarSub label="New" active />
          <SidebarSub label="Pending" />
          <SidebarSub label="Approved" />
          <SidebarSub label="Disapproved" />

          <div className="mt-6" />

          <SidebarItem label="Workers" />
          <SidebarSub label="Active" />
          <SidebarSub label="Inactive" />
          <SidebarSub label="Cancelled" />
          <SidebarSub label="Banned" />

        </div>

      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="flex justify-between items-center px-8 py-4 bg-white border-b">

          <div className="flex items-center gap-4">
            <button className="border rounded px-2 py-1">←</button>
            <div>
              <h1 className="text-xl font-semibold">Candidates</h1>
              <p className="text-sm text-gray-500">
                Manage applicants in one place
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">

            <input
              placeholder="Search worker or candidate"
              className="border px-4 py-2 rounded-md text-sm w-64"
            />

            <button className="border px-3 py-2 rounded-md text-sm">
              Filters
            </button>

            <button className="border px-3 py-2 rounded-md text-sm">
              Refresh
            </button>

            <div className="flex items-center gap-2 text-sm">
              Card View
              <input
                type="checkbox"
                checked={view === "list"}
                onChange={() => setView(view === "card" ? "list" : "card")}
              />
              List View
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full" />
              <span className="text-sm font-medium">Sean Smith</span>
            </div>

          </div>

        </div>

        {/* FILTER BAR */}
        <div className="px-8 py-4 flex gap-4 bg-white border-b">

          <Select label="Type" />
          <Select label="Status" />
          <Select label="Job Role" />
          <Select label="Location" />

        </div>

        {/* CONTENT */}
        <div className="p-8 overflow-auto">

          {view === "card" ? (
            <div className="grid grid-cols-3 gap-6">

              {data.map((c) => (
                <CandidateCard key={c.id} c={c} />
              ))}

            </div>
          ) : (
            <div className="bg-white rounded-xl border">

              {data.map((c) => (
                <CandidateRow key={c.id} c={c} />
              ))}

            </div>
          )}

        </div>

      </div>

    </div>
  )
}

function SidebarItem({ label, active = false }: any) {
  return (
    <div className={`p-3 rounded-lg cursor-pointer ${active ? "bg-white/20" : "hover:bg-white/10"}`}>
      {label}
    </div>
  )
}

function SidebarSub({ label, active = false }: any) {
  return (
    <div className={`ml-4 p-2 rounded cursor-pointer text-sm ${active ? "bg-white text-black" : "hover:bg-white/10"}`}>
      {label}
    </div>
  )
}

function Select({ label }: any) {
  return (
    <select className="border px-3 py-2 rounded-md text-sm">
      <option>{label}</option>
    </select>
  )
}

function CandidateCard({ c }: any) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">

      <div className="flex justify-between items-start">

        <div className="flex gap-3">

          <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center">
            {c.name.charAt(0)}
          </div>

          <div>
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-gray-400">RN #12345</div>
          </div>

        </div>

        <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded">
          {c.status}
        </span>

      </div>

      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <div>📧 {c.email}</div>
        <div>📞 {c.phone}</div>
        <div>📍 {c.location}</div>
      </div>

    </div>
  )
}

function CandidateRow({ c }: any) {
  return (
    <div className="flex justify-between items-center p-4 border-b">

      <div>
        <div className="font-medium">{c.name}</div>
        <div className="text-sm text-gray-500">{c.email}</div>
      </div>

      <div>{c.location}</div>

      <div className="text-teal-600">{c.status}</div>

    </div>
  )
}