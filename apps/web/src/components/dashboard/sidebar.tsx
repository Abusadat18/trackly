"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Timer,
  BarChart3,
  Settings,
  UsersRound,
  ChevronDown,
  UserCircle,
  ClipboardList,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  orgId: string;
  orgName?: string;
  isAdmin?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ orgId, orgName, isAdmin = true, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const base = `/org/${orgId}`;

  const isDashboardActive =
    pathname === base ||
    pathname === base + "/" ||
    pathname.startsWith(`${base}/dashboard`);

  const [dashboardOpen, setDashboardOpen] = useState(isDashboardActive);

  function isActive(href: string) {
    const full = base + href;
    if (href === "") return pathname === base || pathname === base + "/";
    return pathname.startsWith(full);
  }

  const navItems = [
    { label: "Timer", href: "/timer", icon: Timer },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    ...(isAdmin ? [{ label: "AI Insights", href: "/ai-insights", icon: Brain }] : []),
  ];

  const manageItems = [
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Teams", href: "/teams", icon: UsersRound },
    { label: "Time Requests", href: "/time-requests", icon: ClipboardList },
    ...(isAdmin
      ? [{ label: "Members", href: "/members", icon: Users }]
      : []),
  ];

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar-bg text-sidebar-foreground">
      {/* Org name */}
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          {orgName?.[0]?.toUpperCase() || "O"}
        </div>
        <span className="text-sm font-semibold truncate">
          {orgName || "Organization"}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {/* Dashboard — expandable for admin, simple link for member */}
          <li>
            {isAdmin ? (
              <>
                <button
                  onClick={() => setDashboardOpen(!dashboardOpen)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isDashboardActive
                      ? "bg-sidebar-active text-white"
                      : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                  <ChevronDown
                    className={cn(
                      "ml-auto h-4 w-4 transition-transform",
                      dashboardOpen && "rotate-180",
                    )}
                  />
                </button>
                {dashboardOpen && (
                  <ul className="mt-1 ml-4 space-y-1 border-l border-white/10 pl-3">
                    <li>
                      <Link
                        href={`${base}/dashboard/team`}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          isActive("/dashboard/team")
                            ? "text-white font-medium"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <UsersRound className="h-3.5 w-3.5" />
                        Team Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={`${base}/dashboard/user`}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          isActive("/dashboard/user")
                            ? "text-white font-medium"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <UserCircle className="h-3.5 w-3.5" />
                        User Dashboard
                      </Link>
                    </li>
                  </ul>
                )}
              </>
            ) : (
              <Link
                href={base}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isDashboardActive
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </li>

          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={base + item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 mb-2 px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Manage
          </span>
        </div>
        <ul className="space-y-1">
          {manageItems.map((item) => (
            <li key={item.label}>
              <Link
                href={base + item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings — admin/owner only */}
      {isAdmin && (
        <div className="border-t border-white/10 px-3 py-3">
          <Link
            href={`${base}/settings`}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(`${base}/settings`)
                ? "bg-sidebar-active text-white"
                : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground",
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      )}
    </aside>
  );
}
