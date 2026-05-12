"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Circle, Loader2, Archive } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";
}

const STATUS_CONFIG = {
  TODO: { icon: Circle, label: "To Do", color: "text-muted-foreground" },
  IN_PROGRESS: { icon: Loader2, label: "In Progress", color: "text-blue-500" },
  DONE: { icon: CheckCircle2, label: "Done", color: "text-green-500" },
  ARCHIVED: { icon: Archive, label: "Archived", color: "text-gray-400" },
};

const STATUS_ORDER: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE"];

export default function ProjectDetailPage() {
  const { orgId } = useOrg();
  const params = useParams();
  const projectId = params.projectId as string;
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", orgId, projectId],
    queryFn: () => api.get<Project>(`/orgs/${orgId}/projects/${projectId}`),
    enabled: !!orgId && !!projectId,
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", orgId, projectId],
    queryFn: () =>
      api.get<Task[]>(`/orgs/${orgId}/projects/${projectId}/tasks`),
    enabled: !!orgId && !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      api.post(`/orgs/${orgId}/projects/${projectId}/tasks`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", orgId, projectId] });
      setTaskTitle("");
      setShowCreate(false);
      toast.success("Task created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      api.patch(`/orgs/${orgId}/projects/${projectId}/tasks/${taskId}`, {
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", orgId, projectId] });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: project?.color }}
          />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {project?.name}
            </h1>
            {project?.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (taskTitle.trim()) createMutation.mutate(taskTitle.trim());
          }}
          className="mt-4 flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Task title"
            autoFocus
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Add
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

      {/* Kanban-style columns */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {STATUS_ORDER.map((status) => {
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;
          const filtered = tasks?.filter((t) => t.status === status) ?? [];
          return (
            <div key={status} className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <StatusIcon className={`h-4 w-4 ${config.color}`} />
                <h2 className="text-sm font-semibold text-card-foreground">
                  {config.label}
                </h2>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {filtered.length}
                </span>
              </div>
              <div className="p-2 space-y-2 min-h-[100px]">
                {filtered.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-border bg-background p-3 hover:shadow-sm transition-shadow"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex gap-1">
                      {STATUS_ORDER.filter((s) => s !== status).map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            updateStatusMutation.mutate({
                              taskId: task.id,
                              status: s,
                            })
                          }
                          className="rounded px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          → {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
