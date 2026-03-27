"use client"

import { useState } from "react"

const candidates = [
  {
    name: "James Doe",
    email: "jamesdoe@gmail.com",
    phone: "+1 400 180 9141",
    location: "Boston, MA",
    status: "New",
  },
  {
    name: "Clark Johnson",
    email: "jane.doe@gmail.com",
    phone: "+1 300 140 1031",
    location: "Boston, MA",
    status: "New",
  },
  {
    name: "Joe Dalton",
    email: "joedoe@gmail.com",
    phone: "+1 200 290 1024",
    location: "Boston, MA",
    status: "New",
  },
]

export default function RecruiterDashboard() {

  const [view, setView] = useState("card")

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* SIDEBAR */}
      <div className="w-64 bg-teal-900 text-white flex flex-col p-6">

        <div className="text-xl font-bold mb-10">NEXUS</div>

        <div className="space-y-4">

          <div className="text-gray-300 text-sm">RECRUITER MENU</div>

          <div className="bg-teal-700 p-3 rounded-lg cursor-pointer">
            Candidates
          </div>

          <div className="p-3 rounded-lg hover:bg-teal-800 cursor-pointer">
            Job Posts
          </div>

          <div className="p-3 rounded-lg hover:bg-teal-800 cursor-pointer">
            Interviews
          </div>

          <div className="p-3 rounded-lg hover:bg-teal-800 cursor-pointer">
            Reports
          </div>

        </div>

      </div>

      {/* MAIN */}
      <div className="flex-1 p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">

          <div>
            <h1 className="text-2xl font-semibold">Candidates</h1>
            <p className="text-gray-500 text-sm">
              Manage applicants in one place
            </p>
          </div>

          <div className="flex items-center gap-4">

            <input
              placeholder="Search candidates..."
              className="border px-4 py-2 rounded-md text-sm"
            />

            <button className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm">
              + Create Candidate
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm">Card</span>
              <input
                type="checkbox"
                checked={view === "list"}
                onChange={() => setView(view === "card" ? "list" : "card")}
              />
              <span className="text-sm">List</span>
            </div>

          </div>

        </div>

        {/* FILTERS */}
        <div className="flex gap-4 mb-6">

          <select className="border px-3 py-2 rounded-md text-sm">
            <option>Status: All</option>
            <option>New</option>
            <option>Approved</option>
          </select>

          <select className="border px-3 py-2 rounded-md text-sm">
            <option>Job Role: All</option>
          </select>

          <select className="border px-3 py-2 rounded-md text-sm">
            <option>Location: Boston</option>
          </select>

        </div>

        {/* CARDS */}
        {view === "card" ? (
          <div className="grid grid-cols-3 gap-6">

            {candidates.map((c, i) => (

              <div
                key={i}
                className="bg-white p-5 rounded-xl shadow-sm border"
              >

                <div className="flex justify-between items-center mb-2">

                  <div className="flex items-center gap-2">

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

                <div className="text-sm text-gray-600 mt-3 space-y-1">

                  <div>📧 {c.email}</div>
                  <div>📞 {c.phone}</div>
                  <div>📍 {c.location}</div>

                </div>

              </div>

            ))}

          </div>
        ) : (

          <div className="bg-white rounded-xl border">

            {candidates.map((c, i) => (

              <div
                key={i}
                className="flex justify-between p-4 border-b"
              >

                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-500">{c.email}</div>
                </div>

                <div className="text-sm text-gray-500">
                  {c.location}
                </div>

                <div className="text-teal-600 text-sm">
                  {c.status}
                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  )
}