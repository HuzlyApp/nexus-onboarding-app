"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  LogOut,
  Menu,
  Plus,
  Settings,
  UserCheck,
  UserPlus,
  UserX,
  Users,
  X,
} from "lucide-react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

export default function NewApplicantProfileDemoPage() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const candidateName = "John Doe";
  const candidateRole = "Licensed Practical Nurse, LPN";
  const candidateStatus = "New Applicant";
  const candidateLocation = "Charlotte, NC 28262";

  const onboardingItems = useMemo(
    () => [
      { label: "Claimed & Assigned", state: "done" as const },
      { label: "Professional License", state: "done" as const },
      { label: "Skill Assessment", state: "inProgress" as const },
      { label: "Authorization & Documents", state: "todo" as const },
      { label: "Add References", state: "todo" as const },
    ],
    []
  );

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
            <div className="px-4 text-xs uppercase tracking-widest text-teal-400/70 mb-4">
              PERSONAL SETTINGS
            </div>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 rounded-2xl"
            >
              Profile
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/10 rounded-2xl"
            >
              Account
            </a>

            <div className="px-4 pt-8 text-xs uppercase tracking-widest text-teal-400/70 mb-4">
              TEAM MANAGEMENT
            </div>

            {[
              { label: "Candidates", href: "/admin_recruiter/candidates", icon: Users },
              { label: "New", href: "/admin_recruiter/new", icon: UserPlus },
              { label: "Pending", href: "/admin_recruiter/pending", icon: UserCheck },
              { label: "Approved", href: "/admin_recruiter/approved", icon: UserCheck },
              { label: "Disapproved", href: "/admin_recruiter/disapproved", icon: UserX },
              { label: "Workers", href: "/admin_recruiter/workers", icon: Briefcase },
              { label: "Schedule", href: "/admin_recruiter/schedule", icon: Calendar },
            ].map((item) => {
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
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-72">
        <header className="h-16 border-b bg-white flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen((v) => !v)} className="lg:hidden text-zinc-700">
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="font-semibold text-2xl">New Applicant</div>
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
          <div className="max-w-[1320px] mx-auto">
            <div className="mb-5 text-xs text-zinc-400">Admin - New Applicant Detailed Page - Details</div>

            <div className="rounded-2xl border border-[#9CC3FF] overflow-hidden shadow-sm bg-[linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(59,130,246,0.04)_1px,transparent_1px)] bg-[size:34px_34px] bg-white/70">
              {/* Top */}
              <div className="p-6 flex items-start justify-between gap-6 border-b border-[#9CC3FF]/30 bg-white/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                    {initials(candidateName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-zinc-900">{candidateName}</div>
                      <span className="text-[11px] px-3 py-1 rounded-full bg-white/70 border border-zinc-200 text-zinc-700 font-medium">
                        {candidateStatus}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">{candidateRole}</div>
                    <div className="text-xs text-zinc-400">{candidateLocation}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="bg-white/70 border border-[#9CC3FF] text-zinc-800 px-5 py-2.5 rounded-2xl hover:bg-white transition text-sm">
                    <Plus className="inline-block w-4 h-4 mr-2" />
                    New Appointment
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 py-4 border-b border-[#9CC3FF]/20 bg-white/30">
                <div className="flex flex-wrap gap-2">
                  {tabLink("Checklist", "/admin_recruiter/new/checklist", false)}
                  {tabLink("Profile", "/admin_recruiter/new/profile", true)}
                  {tabLink("Attachments", "/admin_recruiter/new/attachments", false)}
                  {tabLink("Skill Assessments", "/admin_recruiter/new/skill-assessments", false)}
                  {tabLink("Authorization", "/admin_recruiter/new/authorization", false)}
                  {tabLink("Activities", "/admin_recruiter/new/activities", false)}
                  {tabLink("Facility Assignments", "/admin_recruiter/new/facility-assignments", false)}
                  {tabLink("History", "/admin_recruiter/new/history", false)}
                </div>
              </div>

              {/* Profile subtabs */}
              <div className="px-6 py-4">
                <div className="inline-flex items-center gap-2 bg-white/70 border border-zinc-200 rounded-3xl p-1">
                  <Link
                    href="/admin_recruiter/new/profile"
                    className="text-xs px-4 py-2 rounded-2xl bg-teal-700 text-white"
                  >
                    Details
                  </Link>
                  <Link
                    href="/admin_recruiter/new/profile/resume"
                    className="text-xs px-4 py-2 rounded-2xl text-zinc-600 hover:bg-white/60"
                  >
                    Resume
                  </Link>
                  <Link
                    href="/admin_recruiter/new/profile/notes"
                    className="text-xs px-4 py-2 rounded-2xl text-zinc-600 hover:bg-white/60"
                  >
                    Notes
                  </Link>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 grid grid-cols-12 gap-6">
                {/* Left */}
                <section className="col-span-4 space-y-6">
                  <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                    <div className="text-sm font-semibold text-zinc-900 mb-4">Candidate Details</div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {[
                        ["First Name", "John"],
                        ["Last Name", "Doe"],
                        ["Date of Birth", "12/10/1983"],
                        ["Email Address", "johndoe@gmail.com"],
                        ["Total Years of Experience in your Profession", "3 yrs"],
                        ["Address", "Charlotte, NC 28262"],
                        ["City", "Charlotte"],
                        ["Zip Code", "28201"],
                        ["Phone Number", "+1 478-543-8089"],
                        ["Last Four Digits of SSN", "—"],
                        ["Worker Status", "Active"],
                        ["Hourly Rate", "$30/hr"],
                      ].map(([k, v]) => (
                        <div key={k} className="col-span-2 grid grid-cols-2 gap-3">
                          <div className="text-zinc-400">{k}</div>
                          <div className="text-zinc-700">{v}</div>
                        </div>
                      ))}

                      <div className="col-span-2 pt-2 border-t border-zinc-100" />

                      {[
                        ["Reference 1 (Name, Email, Phone, Relationship)", "Martha Lawrence (410) 306-6128"],
                        ["Reference 2 (Name, Email, Phone, Relationship)", "—"],
                        ["Reference 3 (Name, Email, Phone, Relationship)", "—"],
                        ["If contacted, may we contact your current employer?", "Yes"],
                        ["Primary Practice Setting", "—"],
                        ["Primary Allied Health Role", "—"],
                      ].map(([k, v]) => (
                        <div key={k} className="col-span-2 grid grid-cols-2 gap-3">
                          <div className="text-zinc-400">{k}</div>
                          <div className="text-zinc-700">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-zinc-900">Nursing Licenses</div>
                      <button className="text-xs px-3 py-1.5 rounded-xl border border-zinc-200 bg-white/70 hover:bg-white transition">
                        + Add Nursing License
                      </button>
                    </div>

                    <div className="space-y-3">
                      {[
                        { state: "State Nursing License Registration #1", reg: "RN123456", exp: "12/02/2027" },
                        { state: "State Nursing License Registration #2", reg: "RN115455", exp: "11/22/2027" },
                      ].map((l) => (
                        <div key={l.reg} className="rounded-xl border border-zinc-200/70 bg-white/60 p-4">
                          <div className="text-xs text-zinc-500">{l.state}</div>
                          <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                            <div className="text-zinc-400">State Nursing License</div>
                            <div className="text-zinc-700">{l.reg}</div>
                            <div className="text-zinc-400">License Expiry Date</div>
                            <div className="text-zinc-700">{l.exp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                    <div className="text-sm font-semibold text-zinc-900 mb-4">Activity Logs</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        ["Source", "Sourced at Resume Upload"],
                        ["Created date", "03/20/2026"],
                        ["Date Resume added", "03/20/2026"],
                        ["Created by", "Nexus Med Pro"],
                        ["Last updated", "1 month ago"],
                      ].map(([k, v]) => (
                        <div key={k} className="col-span-2 grid grid-cols-2 gap-3">
                          <div className="text-zinc-400">{k}</div>
                          <div className="text-zinc-700">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                    <div className="text-sm font-semibold text-zinc-900 mb-4">Activity History</div>
                    <div className="space-y-3">
                      {[
                        { t: "Nexus Med Pro updated the candidate John Doe", ago: "1 week ago" },
                        { t: "Nexus Med Pro updated the candidate John Doe", ago: "2 weeks ago" },
                        { t: "Nexus Med Pro updated the candidate John Doe", ago: "1 month ago" },
                      ].map((h, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-600/10 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-teal-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-zinc-700">{h.t}</div>
                            <div className="text-[11px] text-zinc-400">{h.ago}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Right */}
                <section className="col-span-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                      <div className="text-sm font-semibold text-zinc-900 mb-2">Education</div>
                      <div className="text-xs text-zinc-500">Status</div>
                      <div className="mt-2 text-xs text-zinc-700">
                        Lincoln Technical Institute - Lincoln
                      </div>
                    </div>

                    <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                      <div className="text-sm font-semibold text-zinc-900 mb-2">Experience</div>
                      <div className="text-xs text-zinc-500">Source</div>
                      <div className="mt-2 text-xs text-zinc-700">{candidateRole}</div>
                      <div className="mt-2 text-xs text-zinc-500 leading-relaxed">
                        Charge, team lead, most comfortable with short-term acute care tasks. Prefers night shift.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-zinc-900">Skills</div>
                        <button className="text-xs px-3 py-1.5 rounded-xl border border-zinc-200 bg-white/70 hover:bg-white transition">
                          + Add
                        </button>
                      </div>
                      <div className="text-xs text-zinc-500">Tag based with minimal info</div>
                    </div>

                    <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-zinc-900">Facilities Assigned</div>
                        <button className="text-xs px-3 py-1.5 rounded-xl border border-zinc-200 bg-white/70 hover:bg-white transition">
                          + Add
                        </button>
                      </div>
                      <div className="text-xs text-zinc-500">
                        This section is intended to display the list of facilities.
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-zinc-900">Onboarding Progress</div>
                        <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                          In Progress
                        </span>
                      </div>

                      <div className="space-y-3">
                        {onboardingItems.map((it) => {
                          const color =
                            it.state === "done"
                              ? "text-teal-700"
                              : it.state === "inProgress"
                                ? "text-amber-800"
                                : "text-zinc-400";
                          const dot =
                            it.state === "done"
                              ? "bg-teal-600"
                              : it.state === "inProgress"
                                ? "bg-amber-500"
                                : "bg-zinc-300";
                          return (
                            <div key={it.label} className="flex items-center gap-3 text-xs">
                              <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                              <span className={`font-medium ${color}`}>{it.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                      <div className="text-sm font-semibold text-zinc-900 mb-3">Remarks</div>
                      <div className="text-xs text-zinc-500 mb-4">For any comments or notes</div>
                      <div className="flex flex-wrap gap-2">
                        <button className="text-xs px-4 py-2 rounded-2xl bg-teal-600 text-white hover:bg-teal-700 transition">
                          Approved for work
                        </button>
                        <button className="text-xs px-4 py-2 rounded-2xl border border-zinc-200 bg-white/70 hover:bg-white transition">
                          Disapprove
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 border border-[#9CC3FF]/30 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-zinc-900">Notes</div>
                      <button className="text-xs px-3 py-1.5 rounded-xl border border-zinc-200 bg-white/70 hover:bg-white transition">
                        + Add
                      </button>
                    </div>
                    <div className="text-xs text-zinc-500">No notes added yet.</div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

