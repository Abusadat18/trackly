"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Trash2, Shield } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { formatHours } from "@/lib/utils";
import { toast } from "sonner";

interface OrgMember {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface UserSummary {
  user: { id: string };
  totalHours: number;
  entryCount: number;
}

const ROLE_COLORS = {
  OWNER: "bg-amber-100 text-amber-800",
  ADMIN: "bg-blue-100 text-blue-800",
  MEMBER: "bg-muted text-muted-foreground",
};

export default function MembersPage() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => api.get<OrgMember[]>(`/orgs/${orgId}/members`),
    enabled: !!orgId,
  });

  const { data: userSummary } = useQuery({
    queryKey: ["reports", "user-summary", orgId],
    queryFn: () => api.get<UserSummary[]>(`/orgs/${orgId}/reports/user-summary`),
    enabled: !!orgId,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/orgs/${orgId}/members/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      toast.success("Role updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/orgs/${orgId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      toast.success("Member removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const hoursMap = new Map(
    userSummary?.map((u) => [u.user.id, { hours: u.totalHours, entries: u.entryCount }]),
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
      <h1 className="text-2xl font-bold text-foreground">Members</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage organization members and their roles
      </p>

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
                Hours Logged
              </th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                Entries
              </th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members?.map((member) => {
              const stats = hoursMap.get(member.userId);
              return (
                <tr key={member.userId} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <Link
                      href={`/org/${orgId}/members/${member.userId}`}
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
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
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role]}`}
                    >
                      {member.role === "OWNER" && (
                        <Shield className="h-3 w-3" />
                      )}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {formatHours((stats?.hours ?? 0) * 3600)}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {stats?.entries ?? 0}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {member.role !== "OWNER" && (
                      <div className="flex items-center justify-end gap-1">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              userId: member.userId,
                              role: e.target.value,
                            })
                          }
                          className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          onClick={() => removeMutation.mutate(member.userId)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
