"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  Settings,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type WorkerProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  job_role: string | null;
  city: string | null;
  state: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function ResumeViewer() {
  return (
    <div className="bg-[#2A2A2A] rounded-2xl overflow-hidden border border-black/10">
      <div className="h-12 flex items-center gap-3 px-4 text-white/85 bg-black/15">
        <button className="w-8 h-8 rounded-xl hover:bg-white/10 grid place-items-center">
          <Search className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-xl hover:bg-white/10 grid place-items-center">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 rounded-xl hover:bg-white/10 grid place-items-center">
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="text-xs opacity-80">1 of 2</div>

        <div className="ml-auto flex items-center gap-1">
          <button className="w-8 h-8 rounded-xl hover:bg-white/10 grid place-items-center">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded-xl hover:bg-white/10 grid place-items-center">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="text-xs opacity-80 px-2">Automatic Zoom</div>
          <button className="w-8 h-8 rounded-xl hover:bg-white/10 grid place-items-center">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-8 grid place-items-center">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-10">
            <div className="text-2xl font-bold tracking-tight">RESUME PREVIEW</div>
            <div className="mt-2 text-xs text-zinc-500 max-w-xl">
              This is a UI placeholder. Wire this to the uploaded resume file when available.
            </div>

            <div className="mt-6 grid grid-cols-12 gap-6 text-[11px] leading-5 text-zinc-700">
              <div className="col-span-4">
                <div className="font-semibold text-zinc-900">CONTACT</div>
                <div className="mt-2 space-y-1 text-zinc-600">
                  <div>—</div>
                  <div>—</div>
                  <div>—</div>
                </div>

                <div className="mt-6 font-semibold text-zinc-900">SKILLS</div>
                <ul className="mt-2 space-y-1 text-zinc-600 list-disc pl-4">
                  <li>Patient care</li>
                  <li>Documentation</li>
                  <li>Team collaboration</li>
                </ul>
              </div>

              <div className="col-span-8">
                <div className="font-semibold text-zinc-900">SUMMARY</div>
                <p className="mt-2 text-zinc-600">
                  Resume content will be rendered here once connected to uploads.
                </p>

                <div className="mt-5 font-semibold text-zinc-900">WORK HISTORY</div>
                <div className="mt-2 space-y-3 text-zinc-600">
                  <div>
                    <div className="font-medium text-zinc-800">—</div>
                    <div className="text-zinc-500">—</div>
                  </div>
                  <div>
                    <div className="font-medium text-zinc-800">—</div>
                    <div className="text-zinc-500">—</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewApplicantProfileResumePage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const applicantId = params?.id;

  const isWorkerRoute = pathname?.startsWith("/admin_recruiter/workers/") ?? false;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applicant, setApplicant] = useState<WorkerProfile | null>(null);

  useEffect(() => {
    async function fetchApplicant() {
      if (!applicantId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("worker_profiles")
          .select("id, first_name, last_name, job_role, city, state")
          .eq("id", applicantId)
          .single()
          .returns<WorkerProfile>();

        if (error) throw error;
        setApplicant(data);
      } catch (e) {
        console.error("Failed to fetch applicant profile:", e);
        setApplicant(null);
      } finally {
        setLoading(false);
      }
    }

    fetchApplicant();
  }, [applicantId]);

  const candidateName = useMemo(() => {
    const n = `${applicant?.first_name ?? ""} ${applicant?.last_name ?? ""}`.trim();
    return n || (isWorkerRoute ? "Worker" : "Applicant");
  }, [applicant, isWorkerRoute]);

  const candidateRole = applicant?.job_role || "N/A";
  const candidateLocation = useMemo(() => {
    const parts = [applicant?.city ?? "", applicant?.state ?? ""].filter(Boolean);
    return parts.length ? parts.join(", ") : "—";
  }, [applicant?.city, applicant?.state]);

  const candidateStatus = isWorkerRoute ? "Worker" : "New Applicant";

  const tabLink = (label: string, href: string, active?: boolean) => (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded-xl border transition ${
        active
          ? "border-[#7AA6FF] bg-white text-zinc-900"
          : "border-zinc-200 bg-white/60 text-zinc-600 hover:bg-white"
      }`}
    >
      {label}
    </Link>
  );

  const subTabLink = (label: string, href: string, active?: boolean) => (
    <Link
      href={href}
      className={`text-xs px-4 py-2 rounded-2xl transition ${
        active ? "bg-teal-700 text-white" : "text-zinc-600 hover:bg-white/60"
      }`}
    >
      {label}
    </Link>
  );

  const basePrefix = isWorkerRoute ? `/admin_recruiter/workers/${applicantId}` : `/admin_recruiter/new`;
  const detailsHref = isWorkerRoute
    ? `/admin_recruiter/workers/${applicantId}/profile`
    : `/admin_recruiter/new/profile/${applicantId}`;
  const resumeHref = isWorkerRoute
    ? `/admin_recruiter/workers/${applicantId}/profile/resume`
    : `/admin_recruiter/new/profile/resume/${applicantId}`;
  const notesHref = isWorkerRoute
    ? `/admin_recruiter/workers/${applicantId}/profile/notes`
    : `/admin_recruiter/new/profile/notes/${applicantId}`;

  const sidebarItems = useMemo(
    () => [
      { label: "Candidates", href: "/admin_recruiter/candidates", icon: Users },
      { label: "New", href: "/admin_recruiter/new", icon: UserPlus },
      { label: "Pending", href: "/admin_recruiter/pending", icon: UserCheck },
      { label: "Approved", href: "/admin_recruiter/approved", icon: UserCheck },
      { label: "Disapproved", href: "/admin_recruiter/disapproved", icon: UserX },
      { label: "Workers", href: "/admin_recruiter/workers", icon: Briefcase },
      { label: "Schedule", href: "/admin_recruiter/schedule", icon: Calendar },
    ],
    []
  );

  return (
    <div className="flex min-h-screen bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
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
            <div className="px-4 pt-8 text-xs uppercase tracking-widest text-teal-400/70 mb-4">
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
      <div className="flex-1 flex flex-col lg:pl-72">
        <header className="h-16 border-b bg-white flex items-center px-6 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-2xl border border-zinc-200 flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs text-zinc-400">
                Admin - {isWorkerRoute ? "Worker" : "New Applicant"} Detailed Page - Resume
              </div>
              <div className="text-lg font-semibold text-zinc-900">Candidates</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden" />
            <div className="text-sm">
              <div className="font-medium text-zinc-900">Sean Smith</div>
              <div className="text-xs text-zinc-400 -mt-0.5">Administrator</div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="relative bg-gradient-to-r from-[#F7FAFF] via-white to-[#F7FAFF] border border-[#9CC3FF]/30 rounded-3xl overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 grid place-items-center text-zinc-700">
                  {initials(candidateName)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold text-zinc-900">
                      {loading ? "Loading…" : candidateName}
                    </div>
                    <span className="text-[11px] px-3 py-1 rounded-full bg-white/70 border border-zinc-200 text-zinc-700 font-medium">
                      {candidateStatus}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500">{candidateRole}</div>
                  <div className="text-xs text-zinc-400">{candidateLocation}</div>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden w-10 h-10 rounded-2xl border border-zinc-200 flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 border-b border-[#9CC3FF]/20 bg-white/30">
              <div className="flex flex-wrap gap-2">
                {tabLink("Checklist", `${basePrefix}/checklist`, false)}
                {tabLink("Profile", detailsHref, true)}
                {tabLink("Attachments", `${basePrefix}/attachments`, false)}
                {tabLink("Skill Assessments", `${basePrefix}/skill-assessments`, false)}
                {tabLink("Authorization", `${basePrefix}/authorization`, false)}
                {tabLink("Activities", `${basePrefix}/activities`, false)}
                {tabLink("Facility Assignments", `${basePrefix}/facility-assignments`, false)}
                {tabLink("History", `${basePrefix}/history`, false)}
              </div>
            </div>

            {/* Profile subtabs */}
            <div className="px-6 py-4">
              <div className="inline-flex items-center gap-2 bg-white/70 border border-zinc-200 rounded-3xl p-1">
                {subTabLink("Details", detailsHref, false)}
                {subTabLink("Resume", resumeHref, true)}
                {subTabLink("Notes", notesHref, false)}
              </div>
            </div>

            <div className="px-6 pb-6">
              <ResumeViewer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

