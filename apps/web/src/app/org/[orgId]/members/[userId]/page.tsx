"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, Monitor, Globe } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { formatDuration, formatHours } from "@/lib/utils";

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  project: { name: string; color: string };
  task: { title: string } | null;
}

interface ActivityItem {
  appName: string;
  category: string;
  totalDuration: number;
}

interface ActivitySummary {
  appBreakdown: ActivityItem[];
  categoryBreakdown: { category: string; totalDuration: number }[];
}

export default function MemberDetailPage() {
  const { orgId } = useOrg();
  const params = useParams();
  const userId = params.userId as string;

  const { data: entries, isLoading } = useQuery({
    queryKey: ["time-entries", orgId, userId],
    queryFn: () =>
      api.get<TimeEntry[]>(`/orgs/${orgId}/time-entries`, {
        userId,
        limit: "50",
      }),
    enabled: !!orgId && !!userId,
  });

  const { data: activity } = useQuery({
    queryKey: ["activity", orgId, userId],
    queryFn: () =>
      api.get<ActivitySummary>(`/orgs/${orgId}/activity/summary`, { userId }),
    enabled: !!orgId && !!userId,
  });

  const totalSeconds =
    entries?.reduce((s, e) => s + (e.duration ?? 0), 0) ?? 0;

  const appData =
    activity?.appBreakdown?.slice(0, 8).map((a) => ({
      name: a.appName.length > 15 ? a.appName.slice(0, 15) + "…" : a.appName,
      minutes: Math.round(a.totalDuration / 60),
      category: a.category,
    })) ?? [];

  const CATEGORY_COLORS: Record<string, string> = {
    PRODUCTIVE: "#22c55e",
    NEUTRAL: "#6366f1",
    DISTRACTING: "#ef4444",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">User Activity</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Time tracking and app usage details
      </p>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Total Tracked</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-card-foreground">
            {formatHours(totalSeconds)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Monitor className="h-4 w-4" />
            <span className="text-sm">Time Entries</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-card-foreground">
            {entries?.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="text-sm">Apps Tracked</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-card-foreground">
            {activity?.appBreakdown?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* App usage chart */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            App Usage (minutes)
          </h2>
          {appData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250} className="mt-4">
              <BarChart data={appData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="minutes" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              No activity data
            </p>
          )}
        </div>

        {/* Category breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            Activity Categories
          </h2>
          <div className="mt-4 space-y-3">
            {activity?.categoryBreakdown?.map((cat) => {
              const total =
                activity.categoryBreakdown.reduce(
                  (s, c) => s + c.totalDuration,
                  0,
                ) || 1;
              const pct = Math.round((cat.totalDuration / total) * 100);
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-card-foreground font-medium">
                      {cat.category}
                    </span>
                    <span className="text-muted-foreground">
                      {formatDuration(cat.totalDuration)} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          CATEGORY_COLORS[cat.category] || "#6366f1",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {(!activity?.categoryBreakdown ||
              activity.categoryBreakdown.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No activity data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent time entries */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-card-foreground">
            Recent Time Entries
          </h2>
        </div>
        <div className="divide-y divide-border">
          {entries?.slice(0, 20).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.project.color }}
                />
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {entry.project.name}
                    {entry.task && (
                      <span className="text-muted-foreground">
                        {" "}
                        / {entry.task.title}
                      </span>
                    )}
                  </p>
                  {entry.description && (
                    <p className="text-xs text-muted-foreground">
                      {entry.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium text-card-foreground">
                  {entry.duration ? formatDuration(entry.duration) : "Running"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.startTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {entries?.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              No time entries
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
