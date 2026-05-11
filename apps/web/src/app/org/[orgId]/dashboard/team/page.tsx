"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "recharts";
import { Clock, Users, FolderKanban, Timer } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { formatHours } from "@/lib/utils";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#6d28d9"];

interface Team {
  id: string;
  name: string;
  members: { userId: string }[];
}

interface TeamSummary {
  teamId: string;
  teamName: string;
  memberCount: number;
  totalHours: number;
  entryCount: number;
}

interface UserSummary {
  user: { id: string; firstName: string; lastName: string };
  totalHours: number;
  entryCount: number;
}

interface ProjectSummary {
  projectId: string;
  projectName: string;
  color: string;
  totalHours: number;
}

interface ProductivitySummary {
  dailyTrend: { date: string; totalHours: number }[];
}

export default function TeamDashboardPage() {
  const { orgId, org, isLoading: orgLoading, isAdmin } = useOrg();
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  if (!orgLoading && !isAdmin) {
    router.replace(`/org/${orgId}`);
    return null;
  }

  const { data: teams } = useQuery({
    queryKey: ["teams", orgId],
    queryFn: () => api.get<Team[]>(`/orgs/${orgId}/teams`),
    enabled: !!orgId,
  });

  const { data: teamSummary } = useQuery({
    queryKey: ["reports", "team-summary", orgId],
    queryFn: () => api.get<TeamSummary[]>(`/orgs/${orgId}/reports/team-summary`),
    enabled: !!orgId,
  });

  const { data: userSummary } = useQuery({
    queryKey: ["reports", "user-summary", orgId],
    queryFn: () => api.get<UserSummary[]>(`/orgs/${orgId}/reports/user-summary`),
    enabled: !!orgId,
  });

  const { data: projectSummary } = useQuery({
    queryKey: ["reports", "project-summary", orgId],
    queryFn: () => api.get<ProjectSummary[]>(`/orgs/${orgId}/reports/project-summary`),
    enabled: !!orgId,
  });

  const { data: productivity } = useQuery({
    queryKey: ["reports", "productivity", orgId],
    queryFn: () => api.get<ProductivitySummary>(`/orgs/${orgId}/reports/productivity`),
    enabled: !!orgId,
  });

  const { data: members } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => api.get<{ userId: string }[]>(`/orgs/${orgId}/members`),
    enabled: !!orgId,
  });

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const selectedTeamData = teams?.find((t) => t.id === selectedTeam);
  const teamMemberIds = selectedTeamData
    ? new Set(selectedTeamData.members.map((m) => m.userId))
    : null;

  const filteredUsers = teamMemberIds
    ? (userSummary ?? []).filter((u) => teamMemberIds.has(u.user.id))
    : (userSummary ?? []);

  const totalHours = filteredUsers.reduce((s, u) => s + u.totalHours, 0);
  const totalEntries = filteredUsers.reduce((s, u) => s + u.entryCount, 0);
  const memberCount = teamMemberIds
    ? teamMemberIds.size
    : (members?.length ?? 0);

  const stats = [
    { label: "Total Hours", value: formatHours(totalHours * 3600), icon: Clock },
    { label: "Members", value: memberCount, icon: Users },
    { label: "Projects", value: projectSummary?.length ?? 0, icon: FolderKanban },
    { label: "Time Entries", value: totalEntries, icon: Timer },
  ];

  const topUsers = filteredUsers.slice(0, 5).map((u) => ({
    name: `${u.user.firstName} ${u.user.lastName?.[0] || ""}.`,
    hours: u.totalHours,
  }));

  const teamBarData = (teamSummary ?? []).map((t) => ({
    name: t.teamName,
    hours: t.totalHours,
  }));

  const projectPie = (projectSummary ?? [])
    .filter((p) => p.totalHours > 0)
    .slice(0, 6)
    .map((p, i) => ({
      name: p.projectName,
      value: p.totalHours,
      color: p.color || COLORS[i % COLORS.length],
    }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedTeam === "all"
              ? `Overview of ${org?.name || "organization"} performance`
              : `Performance for ${selectedTeamData?.name}`}
          </p>
        </div>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Teams</option>
          {teams?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold text-card-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Team comparison — only when "All" selected */}
        {selectedTeam === "all" && teamBarData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-card-foreground">
              Hours by Team
            </h2>
            <ResponsiveContainer width="100%" height={250} className="mt-4">
              <BarChart data={teamBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top contributors */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            Top Contributors
          </h2>
          {topUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={250} className="mt-4">
              <BarChart data={topUsers} layout="vertical">
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
              No time entries yet
            </p>
          )}
        </div>

        {/* Project distribution pie */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            Time by Project
          </h2>
          {projectPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250} className="mt-4">
                <PieChart>
                  <Pie
                    data={projectPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {projectPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-3">
                {projectPie.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-xs text-muted-foreground">{p.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              No project data yet
            </p>
          )}
        </div>
      </div>

      {/* Daily trend */}
      {productivity?.dailyTrend && productivity.dailyTrend.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">
            Daily Hours (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={200} className="mt-4">
            <BarChart data={productivity.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="totalHours" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
