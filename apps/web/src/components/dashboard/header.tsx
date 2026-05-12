"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  LogOut,
  Plus,
  Building2,
  Timer as TimerIcon,
  Menu,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { formatDuration } from "@/lib/utils";
import { useTimer } from "@/hooks/use-timer";

interface Org {
  id: string;
  name: string;
  slug: string;
}

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const { orgId, org } = useOrg();
  const { activeTimer, elapsed, stop, isStopping } = useTimer(orgId);
  const router = useRouter();
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { data: orgs } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.get<Org[]>("/orgs"),
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Org switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setOrgDropdownOpen(!orgDropdownOpen);
              setUserDropdownOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <span className="truncate max-w-[120px] sm:max-w-none">
              {org?.name || "Select Organization"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {orgDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOrgDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-card p-1 shadow-lg">
                {orgs?.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      router.push(`/org/${o.id}`);
                      setOrgDropdownOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      o.id === orgId
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-card-foreground hover:bg-accent"
                    }`}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                      {o.name[0]}
                    </div>
                    {o.name}
                  </button>
                ))}
                <div className="my-1 border-t border-border" />
                <Link
                  href="/org"
                  onClick={() => setOrgDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Organization
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Active timer indicator */}
        {activeTimer && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-2 py-1.5 sm:px-3">
            <TimerIcon className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary tabular-nums">
              {formatDuration(elapsed)}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-20 sm:max-w-32 hidden sm:block">
              {activeTimer.project.name}
            </span>
            <button
              onClick={() => stop()}
              disabled={isStopping}
              className="rounded bg-destructive px-2 py-0.5 text-xs font-medium text-white hover:bg-destructive/90 transition-colors"
            >
              Stop
            </button>
          </div>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setOrgDropdownOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {user?.firstName?.[0] || "U"}
            </div>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {user?.firstName} {user?.lastName}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
          </button>

          {userDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1 shadow-lg">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium text-card-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button
                  onClick={async () => {
                    setUserDropdownOpen(false);
                    await logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
