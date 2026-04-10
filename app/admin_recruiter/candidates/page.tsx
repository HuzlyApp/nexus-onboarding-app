// app/admin_recruiter/candidates/page.tsx
"use client"

import { useMemo, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  Briefcase,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
} from "lucide-react"

type WorkerProfile = {
  id: string
  first_name: string | null
  last_name: string | null
  job_role: string | null
  email: string | null
  phone: string | null
  address1: string | null
  city: string | null
  state: string | null
  created_at: string | null
}

type Candidate = {
  id: string
  name: string
  role: string
  email: string
  phone: string
  address: string
  status: "New" | "Pending" | "Approved" | "Disapproved"
  createdAt: string | null
  reference: string
}

const sidebarItems = [
  { label: "Candidates", href: "/admin_recruiter/candidates", icon: Users },
  { label: "New", href: "/admin_recruiter/new", icon: UserPlus },
  { label: "Pending", href: "/admin_recruiter/pending", icon: UserCheck },
  { label: "Approved", href: "/admin_recruiter/approved", icon: UserCheck },
  { label: "Disapproved", href: "/admin_recruiter/disapproved", icon: UserX },
  { label: "Workers", href: "/admin_recruiter/workers", icon: Briefcase },
  { label: "Schedule", href: "/admin_recruiter/schedule", icon: Calendar },
]

export default function CandidatesPage() {
  const pathname = usePathname()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"card" | "list">("card")

  // Fetch workers dynamically from server API (avoids RLS issues in browser)
  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true)
      try {
        const res = await fetch("/api/workers")
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to fetch workers")

        const rows: WorkerProfile[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.workers)
            ? data.workers
            : []
        const mapped: Candidate[] = rows.map((item) => ({
          id: item.id,
          name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
          role: item.job_role || "N/A",
          email: item.email || "",
          phone: item.phone || "",
          address: [item.address1, item.city, item.state].filter(Boolean).join(", "),
          status: "New",
          createdAt: item.created_at,
          reference: item.id.slice(0, 7).toUpperCase(),
        }))

        setCandidates(mapped)
      } catch (err) {
        console.error("Failed to fetch workers:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [])

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Dynamic Sidebar - Exact Figma match */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0A1F1C] text-white transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="px-6 py-8 flex items-center gap-3 border-b border-white/10">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center">
              <span className="text-[#0A1F1C] font-bold text-3xl">N</span>
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-tight">Nexus</div>
              <div className="text-xs text-teal-400 -mt-1">MedPro Staffing</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-8 space-y-1">
            <div className="px-4 text-xs uppercase tracking-widest text-teal-400/70 mb-4">PERSONAL SETTINGS</div>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 rounded-2xl">Profile</a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 rounded-2xl">Account</a>

            <div className="px-4 pt-8 text-xs uppercase tracking-widest text-teal-400/70 mb-4">TEAM MANAGEMENT</div>

            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm rounded-2xl transition-all ${isActive ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10"}`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}

            <div className="px-4 pt-10">
              <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 rounded-2xl">
                <Settings className="w-5 h-5" /> Settings
              </a>
            </div>
          </nav>

          {/* Sign out */}
          <div className="p-6 border-t border-white/10">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/10 rounded-2xl">
              <LogOut className="w-5 h-5" /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b bg-white flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-zinc-700">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="font-semibold text-2xl">Workers</div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Online
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-medium text-sm">Sean Smith</div>
                <div className="text-xs text-zinc-500">Manager</div>
              </div>
              <img src="https://i.pravatar.cc/128?u=sean" alt="Sean Smith" className="w-9 h-9 rounded-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-semibold">Workers</h1>
                <p className="text-zinc-500">Manage workers in one place</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl transition">
                  <Plus className="w-5 h-5" /> Create Worker
              </button>

              <div className="flex items-center bg-white border border-zinc-200 rounded-2xl px-5 py-3">
                <Search className="w-5 h-5 text-zinc-400 mr-3" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search worker or candidate"
                  className="bg-transparent outline-none flex-1 min-w-[220px]"
                />
              </div>

              <button className="flex items-center gap-2 border border-zinc-200 hover:bg-zinc-50 px-6 py-3 rounded-2xl transition">
                <Filter className="w-5 h-5" /> Filters
              </button>

              <button className="flex items-center gap-2 border border-zinc-200 hover:bg-zinc-50 px-6 py-3 rounded-2xl transition">
                <RefreshCw className="w-5 h-5" /> Refresh
              </button>
            </div>
          </div>

          {/* Filters row + view toggle (matches screenshot layout) */}
          <div className="bg-white border border-zinc-200 rounded-3xl px-6 py-4 mb-6">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Type</span>
                  <button className="text-sm px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50">
                    Workers
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Status</span>
                  <button className="text-sm px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50">
                    New
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Job Role</span>
                  <button className="text-sm px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50">
                    All
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Location</span>
                  <button className="text-sm px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50">
                    Boston
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">Card View</span>
                <button
                  type="button"
                  aria-label="Toggle list view"
                  onClick={() => setView((v) => (v === "card" ? "list" : "card"))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    view === "list" ? "bg-teal-600" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                      view === "list" ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-xs text-zinc-500">List View</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="text-sm text-zinc-500 mb-4">
            Total: <span className="font-medium text-zinc-800">
              {candidates.filter(Boolean).length}
            </span>{" "}
            Results
          </div>

          {(() => {
            const filtered = candidates.filter((c) => {
              const q = query.trim().toLowerCase()
              if (!q) return true
              return (
                c.name.toLowerCase().includes(q) ||
                c.role.toLowerCase().includes(q) ||
                c.reference.toLowerCase().includes(q) ||
                c.address.toLowerCase().includes(q)
              )
            })

            const formatDate = (iso: string | null) => {
              if (!iso) return "—"
              const d = new Date(iso)
              if (Number.isNaN(d.getTime())) return "—"
              return d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" })
            }

            if (loading) {
              return <div className="text-center py-20 text-zinc-500">Loading workers...</div>
            }
            if (filtered.length === 0) {
              return <div className="text-center py-20 text-zinc-500">No workers found.</div>
            }

            if (view === "list") {
              return (
                <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden">
                  <div className="overflow-auto">
                    <table className="min-w-[980px] w-full">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
                          <th className="px-6 py-4 font-medium">Name</th>
                          <th className="px-4 py-4 font-medium">Status</th>
                          <th className="px-4 py-4 font-medium">Reference</th>
                          <th className="px-4 py-4 font-medium">Job Role</th>
                          <th className="px-4 py-4 font-medium">Created Date</th>
                          <th className="px-6 py-4 font-medium">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c) => (
                          <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50/70">
                            <td className="px-6 py-4">
                              <div className="font-medium text-zinc-900">{c.name}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-zinc-600">{c.reference}</td>
                            <td className="px-4 py-4 text-sm text-zinc-600">{c.role}</td>
                            <td className="px-4 py-4 text-sm text-zinc-600">{formatDate(c.createdAt)}</td>
                            <td className="px-6 py-4 text-sm text-zinc-600">{c.address || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            }

            // Card View
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          {(c.name.split(" ").map((p) => p[0]).slice(0, 2).join("") || "NA").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900 truncate">{c.name}</div>
                          <div className="text-[11px] text-zinc-400">
                            RN #{c.reference}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-2xl border border-zinc-200 hover:bg-zinc-50" aria-label="View" />
                        <button className="w-8 h-8 rounded-2xl border border-zinc-200 hover:bg-zinc-50" aria-label="Edit" />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <CalendarDays className="w-4 h-4 text-teal-700" />
                        {formatDate(c.createdAt)}
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-800">
                        {c.status}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2 text-xs text-zinc-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-teal-700" />
                        <span className="truncate">{c.email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-teal-700" />
                        <span className="truncate">{c.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-teal-700" />
                        <span className="truncate">{c.address || "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

        </div>
      </div>
    </div>
  )
}