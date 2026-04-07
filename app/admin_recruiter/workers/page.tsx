"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Calendar,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type WorkerProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  job_role: string | null;
  created_at: string | null;
  email: string | null;
  phone: string | null;
  address1: string | null;
  city: string | null;
  state: string | null;
};

const sidebarItems = [
  { label: "Candidates", href: "/admin_recruiter/candidates", icon: UserPlus },
  { label: "New", href: "/admin_recruiter/new", icon: UserPlus },
  { label: "Pending", href: "/admin_recruiter/pending", icon: UserCheck },
  { label: "Approved", href: "/admin_recruiter/approved", icon: UserCheck },
  { label: "Disapproved", href: "/admin_recruiter/disapproved", icon: UserX },
  { label: "Workers", href: "/admin_recruiter/workers", icon: Briefcase },
  { label: "Schedule", href: "/admin_recruiter/schedule", icon: Calendar },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function WorkersPage() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<
    Array<{
      id: string;
      name: string;
      role: string;
      createdAt: string | null;
      email: string;
      phone: string;
      location: string;
    }>
  >([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchWorkers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("worker_profiles")
          .select("id, first_name, last_name, job_role, created_at, email, phone, address1, city, state")
          .order("created_at", { ascending: false })
          .returns<WorkerProfile[]>();

        if (error) throw error;

        const mapped = (data ?? []).map((item) => {
          const name = `${item.first_name ?? ""} ${item.last_name ?? ""}`.trim() || "Unnamed";
          const location = [item.city, item.state].filter(Boolean).join(", ") || "—";
          return {
            id: item.id,
            name,
            role: item.job_role || "N/A",
            createdAt: item.created_at,
            email: item.email || "",
            phone: item.phone || "",
            location,
          };
        });

        setWorkers(mapped);
      } catch (e) {
        console.error("Failed to fetch workers:", e);
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter((w) => {
      return (
        w.name.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q) ||
        w.location.toLowerCase().includes(q)
      );
    });
  }, [workers, query]);

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Dynamic Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0A1F1C] text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="px-6 py-8 flex items-center gap-3 border-b border-white/10">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center">
              <span className="text-[#0A1F1C] font-bold text-3xl">N</span>
            </div>
            <div>
              <div className="font-semibold text-2xl tracking-tight">Nexus</div>
              <div className="text-xs text-teal-400 -mt-1">MedPro Staffing</div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-8 space-y-1">
            <div className="px-4 text-xs uppercase tracking-widest text-teal-400/70 mb-4">
              TEAM MANAGEMENT
            </div>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm rounded-2xl transition-all ${
                    isActive ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="px-4 pt-10">
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 rounded-2xl"
              >
                <Settings className="w-5 h-5" /> Settings
              </a>
            </div>
          </nav>

          <div className="p-6 border-t border-white/10">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-white/10 rounded-2xl">
              <LogOut className="w-5 h-5" /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-white flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden text-zinc-700"
            >
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
              <img
                src="https://i.pravatar.cc/128?u=sean"
                alt="Sean Smith"
                className="w-9 h-9 rounded-full object-cover"
              />
            </div>
          </div>
        </header>

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
                  placeholder="Search worker"
                  className="bg-transparent outline-none flex-1 min-w-[220px]"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500">Loading workers...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">No workers found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((w) => (
                <div key={w.id} className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          {initials(w.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-lg truncate">{w.name}</div>
                          <div className="text-teal-600 text-sm truncate">{w.role}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500">
                        <Calendar className="w-4 h-4 text-teal-700" />
                        {formatDate(w.createdAt)}
                      </div>
                      <div className="mt-3 space-y-2 text-xs text-zinc-600">
                        <div className="truncate">{w.email || "—"}</div>
                        <div className="truncate">{w.phone || "—"}</div>
                        <div className="truncate">{w.location}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 flex gap-3">
                    <Link
                      href={`/admin_recruiter/workers/${w.id}/profile`}
                      className="flex-1 border border-zinc-200 py-2.5 rounded-2xl text-sm hover:bg-zinc-50 inline-flex items-center justify-center"
                    >
                      View Profile
                    </Link>
                    <button className="flex-1 bg-teal-600 text-white py-2.5 rounded-2xl text-sm hover:bg-teal-700">
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

