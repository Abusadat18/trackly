"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCircle,
  Timer,
  BarChart3,
  Brain,
  Settings,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  orgId: string;
  orgName?: string;
}

const navItems = [
  { label: "Dashboard", href: "", icon: LayoutDashboard },
  { label: "Timer", href: "/timer", icon: Timer },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "AI Insights", href: "/ai-insights", icon: Brain },
];

const manageItems = [
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Teams", href: "/teams", icon: UsersRound },
  { label: "Members", href: "/members", icon: Users },
];

export function Sidebar({ orgId, orgName }: SidebarProps) {
  const pathname = usePathname();
  const base = `/org/${orgId}`;

  function isActive(href: string) {
    const full = base + href;
    if (href === "") return pathname === base || pathname === base + "/";
    return pathname.startsWith(full);
  }

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
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={base + item.href}
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

      {/* Settings */}
      <div className="border-t border-white/10 px-3 py-3">
        <Link
          href={`${base}/settings`}
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
    </aside>
  );
}
