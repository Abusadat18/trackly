"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { formatHours } from "@/lib/utils";

interface TeamSummary {
  teamId: string;
  teamName: string;
  memberCount: number;
  totalHours: number;
}

interface UserSummary {
  user: { id: string; firstName: string; lastName: string };
  totalHours: number;
  entryCount: number;
}

interface ProjectSummary {
  projectName: string;
  color: string;
  totalHours: number;
  uniqueContributors: number;
}

interface ProductivitySummary {
  categoryBreakdown: {
    category: string;
    totalSeconds: number;
    percentage: number;
  }[];
  totalActivitySeconds: number;
  dailyTrend: { date: string; totalHours: number }[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#06b6d4"];
const CATEGORY_COLORS: Record<string, string> = {
  PRODUCTIVE: "#22c55e",
  NEUTRAL: "#6366f1",
  DISTRACTING: "#ef4444",
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getWeekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function getMonthAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split("T")[0];
}

export default function ReportsPage() {
  const { orgId, isAdmin } = useOrg();
  const [mode, setMode] = useState<"range" | "day">("range");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [singleDate, setSingleDate] = useState("");

  const queryParams: Record<string, string> = {};
  if (mode === "day" && singleDate) {
    queryParams.startDate = singleDate;
    queryParams.endDate = singleDate;
  } else {
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
  }

  const activeStart = mode === "day" ? singleDate : startDate;
  const activeEnd = mode === "day" ? singleDate : endDate;

  const { data: teamSummary } = useQuery({
    queryKey: ["reports", "team-summary", orgId, activeStart, activeEnd],
    queryFn: () =>
      api.get<TeamSummary[]>(`/orgs/${orgId}/reports/team-summary`, queryParams),
    enabled: !!orgId,
  });

  const { data: userSummary } = useQuery({
    queryKey: ["reports", "user-summary", orgId, activeStart, activeEnd],
    queryFn: () =>
      api.get<UserSummary[]>(`/orgs/${orgId}/reports/user-summary`, queryParams),
    enabled: !!orgId,
  });

  const { data: projectSummary } = useQuery({
    queryKey: ["reports", "project-summary", orgId, activeStart, activeEnd],
    queryFn: () =>
      api.get<ProjectSummary[]>(
        `/orgs/${orgId}/reports/project-summary`,
        queryParams,
      ),
    enabled: !!orgId,
  });

  const { data: productivity } = useQuery({
    queryKey: ["reports", "productivity", orgId, activeStart, activeEnd],
    queryFn: () =>
      api.get<ProductivitySummary>(
        `/orgs/${orgId}/reports/productivity`,
        queryParams,
      ),
    enabled: !!orgId,
  });

  const teamBarData = teamSummary?.map((t) => ({
    name: t.teamName,
    hours: t.totalHours,
    members: t.memberCount,
  })) ?? [];

  const userBarData = (userSummary ?? []).slice(0, 8).map((u) => ({
    name: `${u.user.firstName} ${u.user.lastName?.[0] || ""}.`,
    hours: u.totalHours,
  }));

  const projectPieData = (projectSummary ?? []).slice(0, 6).map((p, i) => ({
    name: p.projectName,
    value: p.totalHours,
    color: p.color || COLORS[i % COLORS.length],
  }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Analyze time tracking data across your organization"
              : "Your personal time tracking reports"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode("range")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "range"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Range
            </button>
            <button
              onClick={() => setMode("day")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "day"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Single Day
            </button>
            <span className="mx-1 text-border">|</span>
            <button
              onClick={() => {
                setMode("day");
                setSingleDate(getToday());
              }}
              className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              Today
            </button>
            <button
              onClick={() => {
                setMode("range");
                setStartDate(getWeekAgo());
                setEndDate(getToday());
              }}
              className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              7d
            </button>
            <button
              onClick={() => {
                setMode("range");
                setStartDate(getMonthAgo());
                setEndDate(getToday());
              }}
              className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              30d
            </button>
          </div>
          {mode === "range" ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          ) : (
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Team comparison — admin only */}
        {isAdmin && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-card-foreground">
              Hours by Team
            </h2>
            {teamBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250} className="mt-4">
                <BarChart data={teamBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                No data
              </p>
            )}
          </div>
        )}

        {/* User leaderboard — admin only */}
        {isAdmin && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-card-foreground">
              Top Contributors
            </h2>
            {userBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250} className="mt-4">
                <BarChart data={userBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                No data
              </p>
            )}
          </div>
        )}

        {/* Project distribution */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            Time by Project
          </h2>
          {projectPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250} className="mt-4">
                <PieChart>
                  <Pie
                    data={projectPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {projectPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-3">
                {projectPieData.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {p.name} ({p.value}h)
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              No data
            </p>
          )}
        </div>

        {/* Productivity categories */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            Activity Categories
          </h2>
          <div className="mt-4 space-y-4">
            {productivity?.categoryBreakdown?.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-card-foreground">
                    {cat.category}
                  </span>
                  <span className="text-muted-foreground">
                    {cat.percentage}%
                  </span>
                </div>
                <div className="mt-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor:
                        CATEGORY_COLORS[cat.category] || "#6366f1",
                    }}
                  />
                </div>
              </div>
            ))}
            {(!productivity?.categoryBreakdown ||
              productivity.categoryBreakdown.length === 0) && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No activity data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Daily trend */}
      {productivity?.dailyTrend && productivity.dailyTrend.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            Daily Hours Trend
          </h2>
          <ResponsiveContainer width="100%" height={200} className="mt-4">
            <LineChart data={productivity.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="totalHours"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
