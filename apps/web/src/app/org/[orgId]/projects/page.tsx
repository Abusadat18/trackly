"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isArchived: boolean;
}

const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

export default function ProjectsPage() {
  const { orgId, isAdmin } = useOrg();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => api.get<Project[]>(`/orgs/${orgId}/projects`),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color: string }) =>
      api.post(`/orgs/${orgId}/projects`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
      setName("");
      setDescription("");
      setShowCreate(false);
      toast.success("Project created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

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
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage projects and track time across them
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      {showCreate && isAdmin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim())
              createMutation.mutate({
                name: name.trim(),
                description: description.trim() || undefined,
                color,
              });
          }}
          className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Project name"
            autoFocus
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Description (optional)"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Color:</span>
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-all ${
                  color === c ? "border-foreground scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
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
          </div>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/org/${orgId}/projects/${project.id}`}
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <h3 className="font-semibold text-card-foreground">
                {project.name}
              </h3>
            </div>
            {project.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FolderKanban className="h-3 w-3" />
                View tasks
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}

        {projects?.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-12">
            No projects yet. Create your first project to start tracking time.
          </p>
        )}
      </div>
    </div>
  );
}
