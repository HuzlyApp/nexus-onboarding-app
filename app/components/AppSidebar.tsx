
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  HardHat,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Plus,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils"; // ← create this or use class-variance-authority

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  active?: boolean;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Candidates",
    icon: Users,
    href: "/dashboard/candidates",
    active: true,
    children: [
      { label: "All", href: "/dashboard/candidates?status=all", active: true },
      { label: "New", href: "/dashboard/candidates?status=new" },
      { label: "Pending", href: "/dashboard/candidates?status=pending" },
      { label: "Approved", href: "/dashboard/candidates?status=approved" },
      { label: "Disapproved", href: "/dashboard/candidates?status=disapproved" },
    ],
  },
  {
    label: "Workers",
    icon: HardHat,
    href: "/dashboard/workers",
    children: [
      { label: "Active", href: "/dashboard/workers?status=active" },
      { label: "Inactive", href: "/dashboard/workers?status=inactive" },
      { label: "Cancelled", href: "/dashboard/workers?status=cancelled" },
      { label: "Banned", href: "/dashboard/workers?status=banned" },
    ],
  },
];

export default function AppSidebar() {
  const [openGroups, setOpenGroups] = useState<string[]>(["Candidates"]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 transform bg-gradient-to-b from-emerald-950 to-teal-950",
        "text-teal-100 transition-transform duration-300 lg:translate-x-0",
        "-translate-x-full" // mobile closed by default — control via context or sheet
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-teal-800/50 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white font-bold">
          H
        </div>
        <span className="text-lg font-semibold tracking-tight">Huzly</span>
      </div>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-400" />
          <input
            type="text"
            placeholder="Search worker or candidate..."
            className="w-full rounded-lg bg-teal-900/60 pl-10 pr-4 py-2.5 text-sm placeholder-teal-400 focus:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-2">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      item.active
                        ? "bg-teal-800/50 text-white"
                        : "text-teal-300 hover:bg-teal-900/60 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openGroups.includes(item.label) && "rotate-180"
                      )}
                    />
                  </button>

                  {openGroups.includes(item.label) && (
                    <ul className="mt-1 space-y-1 pl-11">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            className={cn(
                              "block rounded-lg px-3 py-2 text-sm transition-colors",
                              child.active
                                ? "bg-teal-700/60 text-white"
                                : "text-teal-300 hover:bg-teal-900/50 hover:text-white"
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    item.active
                      ? "bg-teal-800/50 text-white"
                      : "text-teal-300 hover:bg-teal-900/60 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section - Personal Settings */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-teal-800/50 p-4">
        <div className="space-y-1">
          <Link
            href="/settings/profile"
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-teal-300 hover:bg-teal-900/60 hover:text-white"
          >
            <Settings className="h-5 w-5" />
            Personal Settings
          </Link>
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-red-300 hover:bg-red-950/40 hover:text-red-200">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}