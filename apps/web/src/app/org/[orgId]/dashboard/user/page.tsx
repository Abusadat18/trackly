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
import { Clock, FolderKanban, Timer } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { formatHours, formatDuration } from "@/lib/utils";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#6d28d9"];

interface OrgMember {
  userId: string;
  role: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  duration: number | null;
  project: { name: string; color: string };
  task: { title: string } | null;
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

export default function UserDashboardPage() {
  const { orgId, isLoading: orgLoading, isAdmin } = useOrg();
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  if (!orgLoading && !isAdmin) {
    router.replace(`/org/${orgId}`);
    return null;
  }

  const { data: members } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => api.get<OrgMember[]>(`/orgs/${orgId}/members`),
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

  const { data: userEntries } = useQuery({
    queryKey: ["time-entries", orgId, "user-dashboard", selectedUserId],
    queryFn: () =>
      api.get<TimeEntry[]>(`/orgs/${orgId}/time-entries`, {
        userId: selectedUserId,
        limit: "15",
      }),
    enabled: !!orgId && !!selectedUserId,
  });

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const selectedMember = members?.find((m) => m.userId === selectedUserId);
  const selectedUserSummary = userSummary?.find((u) => u.user.id === selectedUserId);

  const userProjectHours = selectedUserId && userEntries
    ? (() => {
        const map = new Map<string, { name: string; color: string; hours: number }>();
        for (const entry of userEntries) {
          if (!entry.duration) continue;
          const existing = map.get(entry.project.name);
          if (existing) {
            existing.hours += entry.duration / 3600;
          } else {
            map.set(entry.project.name, {
              name: entry.project.name,
              color: entry.project.color,
              hours: entry.duration / 3600,
            });
          }
        }
        return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
      })()
    : [];

  const projectPie = userProjectHours.slice(0, 6).map((p, i) => ({
    name: p.name,
    value: Number(p.hours.toFixed(2)),
    color: p.color || COLORS[i % COLORS.length],
  }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedMember
              ? `Performance for ${selectedMember.user.firstName} ${selectedMember.user.lastName}`
              : "Select a user to view their performance"}
          </p>
        </div>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select a user...</option>
          {members?.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.firstName} {m.user.lastName} ({m.role})
            </option>
          ))}
        </select>
      </div>

      {!selectedUserId && (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Choose a team member from the dropdown to view their dashboard.
          </p>

          {/* All users overview table */}
          {userSummary && userSummary.length > 0 && (
            <div className="mt-8 mx-auto max-w-2xl rounded-xl border border-border bg-card shadow-sm overflow-hidden text-left">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Member
                    </th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Hours
                    </th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                      Entries
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {userSummary.map((u) => (
                    <tr
                      key={u.user.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => setSelectedUserId(u.user.id)}
                    >
                      <td className="px-5 py-3 font-medium text-card-foreground">
                        {u.user.firstName} {u.user.lastName}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatHours(u.totalHours * 3600)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {u.entryCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedUserId && selectedUserSummary && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {formatHours(selectedUserSummary.totalHours * 3600)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Time Entries</p>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {selectedUserSummary.entryCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Projects</p>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold text-card-foreground">
                {userProjectHours.length}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Project time pie */}
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
                        <span className="text-xs text-muted-foreground">
                          {p.name} ({p.value}h)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  No project data
                </p>
              )}
            </div>

            {/* Recent entries */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-card-foreground">
                  Recent Entries
                </h2>
              </div>
              <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
                {userEntries?.map((entry) => (
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
                              {" / "}{entry.task.title}
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
                    <span className="text-sm font-medium text-card-foreground whitespace-nowrap ml-2">
                      {entry.duration ? formatDuration(entry.duration) : "Running..."}
                    </span>
                  </div>
                ))}
                {(!userEntries || userEntries.length === 0) && (
                  <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                    No time entries for this user.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
