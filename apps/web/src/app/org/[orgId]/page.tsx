"use client";

import { useOrg } from "@/providers/org-provider";

export default function OrgDashboardPage() {
  const { org, isLoading } = useOrg();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        {org?.name || "Dashboard"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Overview of your organization&apos;s activity
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Hours", value: "—" },
          { label: "Active Members", value: "—" },
          { label: "Projects", value: "—" },
          { label: "Active Timers", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-card-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground">
          Recent Activity
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Dashboard stats and charts will be populated in Phase 5.
        </p>
      </div>
    </div>
  );
}
