"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, UsersRound, Clock, ArrowRight } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { formatHours } from "@/lib/utils";
import { toast } from "sonner";

interface TeamSummary {
  teamId: string;
  teamName: string;
  memberCount: number;
  totalHours: number;
  entryCount: number;
}

interface Team {
  id: string;
  name: string;
  members: { userId: string; role: string }[];
}

export default function TeamsPage() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", orgId],
    queryFn: () => api.get<Team[]>(`/orgs/${orgId}/teams`),
    enabled: !!orgId,
  });

  const { data: teamSummary } = useQuery({
    queryKey: ["reports", "team-summary", orgId],
    queryFn: () => api.get<TeamSummary[]>(`/orgs/${orgId}/reports/team-summary`),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post(`/orgs/${orgId}/teams`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", orgId] });
      setTeamName("");
      setShowCreate(false);
      toast.success("Team created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const summaryMap = new Map(teamSummary?.map((t) => [t.teamId, t]));

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
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your teams and track their performance
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Team
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (teamName.trim()) createMutation.mutate(teamName.trim());
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Team name"
            autoFocus
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams?.map((team) => {
          const summary = summaryMap.get(team.id);
          return (
            <Link
              key={team.id}
              href={`/org/${orgId}/teams/${team.id}`}
              className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground">
                  {team.name}
                </h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <UsersRound className="h-3.5 w-3.5" />
                  {team.members.length} members
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatHours((summary?.totalHours ?? 0) * 3600)}
                </div>
              </div>
            </Link>
          );
        })}

        {teams?.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">
            No teams yet. Create your first team to get started.
          </p>
        )}
      </div>
    </div>
  );
}
