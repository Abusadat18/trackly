"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Crown, Trash2, Clock } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { formatHours } from "@/lib/utils";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
  members: {
    userId: string;
    role: string;
    user: { id: string; firstName: string; lastName: string; email: string };
  }[];
}

interface OrgMember {
  userId: string;
  role: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface UserSummary {
  user: { id: string; firstName: string; lastName: string };
  totalSeconds: number;
  totalHours: number;
}

export default function TeamDetailPage() {
  const { orgId, isAdmin } = useOrg();
  const params = useParams();
  const teamId = params.teamId as string;
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", orgId, teamId],
    queryFn: () => api.get<Team>(`/orgs/${orgId}/teams/${teamId}`),
    enabled: !!orgId && !!teamId,
  });

  const { data: orgMembers } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => api.get<OrgMember[]>(`/orgs/${orgId}/members`),
    enabled: !!orgId && showAddMember,
  });

  const { data: userSummary } = useQuery({
    queryKey: ["reports", "user-summary", orgId],
    queryFn: () => api.get<UserSummary[]>(`/orgs/${orgId}/reports/user-summary`),
    enabled: !!orgId,
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/orgs/${orgId}/teams/${teamId}/members`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", orgId, teamId] });
      setShowAddMember(false);
      setSelectedUserId("");
      toast.success("Member added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/orgs/${orgId}/teams/${teamId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", orgId, teamId] });
      toast.success("Member removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/orgs/${orgId}/teams/${teamId}/members/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", orgId, teamId] });
      toast.success("Role updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const hoursMap = new Map(userSummary?.map((u) => [u.user.id, u.totalHours]));

  const existingMemberIds = new Set(team?.members.map((m) => m.userId));
  const availableMembers = orgMembers?.filter(
    (m) => !existingMemberIds.has(m.userId),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{team?.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {team?.members.length} members
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </button>
        )}
      </div>

      {showAddMember && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Select a member...</option>
              {availableMembers?.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.firstName} {m.user.lastName} ({m.user.email})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedUserId) addMemberMutation.mutate(selectedUserId);
              }}
              disabled={!selectedUserId || addMemberMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddMember(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                Member
              </th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                Role
              </th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                Total Hours
              </th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {team?.members.map((member) => (
              <tr key={member.userId} className="hover:bg-muted/30">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {member.user.firstName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() =>
                      updateRoleMutation.mutate({
                        userId: member.userId,
                        role:
                          member.role === "TEAM_LEAD" ? "MEMBER" : "TEAM_LEAD",
                      })
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      member.role === "TEAM_LEAD"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {member.role === "TEAM_LEAD" && (
                      <Crown className="h-3 w-3" />
                    )}
                    {member.role === "TEAM_LEAD" ? "Team Lead" : "Member"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatHours((hoursMap.get(member.userId) ?? 0) * 3600)}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  {isAdmin && (
                    <button
                      onClick={() => removeMemberMutation.mutate(member.userId)}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
