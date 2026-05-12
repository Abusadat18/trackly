"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Square, Clock } from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { useTimer } from "@/hooks/use-timer";
import { api } from "@/lib/api-client";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
}

export default function TimerPage() {
  const { orgId } = useOrg();
  const { activeTimer, elapsed, isLoading, isStarting, isStopping, start, stop } =
    useTimer(orgId);
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [description, setDescription] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => api.get<Project[]>(`/orgs/${orgId}/projects`),
    enabled: !!orgId,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", orgId, projectId],
    queryFn: () =>
      api.get<Task[]>(`/orgs/${orgId}/projects/${projectId}/tasks`),
    enabled: !!orgId && !!projectId,
  });

  async function handleStart() {
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }
    try {
      await start({
        projectId,
        taskId: taskId || undefined,
        description: description || undefined,
      });
      toast.success("Timer started");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start timer");
    }
  }

  async function handleStop() {
    try {
      await stop();
      toast.success("Timer stopped");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to stop timer");
    }
  }

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Timer</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track your work time
      </p>

      {/* Timer display */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="text-6xl font-mono font-bold text-card-foreground tabular-nums">
          {String(hours).padStart(2, "0")}:
          {String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </div>

        {activeTimer && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: activeTimer.project.color || "#6366f1" }}
            />
            <span className="text-sm font-medium text-card-foreground">
              {activeTimer.project.name}
            </span>
            {activeTimer.task && (
              <span className="text-sm text-muted-foreground">
                / {activeTimer.task.title}
              </span>
            )}
          </div>
        )}

        {/* Controls */}
        {!activeTimer ? (
          <div className="mt-8 space-y-4">
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setTaskId("");
              }}
              className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select a project...</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {projectId && tasks && tasks.length > 0 && (
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a task (optional)...</option>
                {tasks
                  .filter((t) => t.status !== "ARCHIVED")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            )}

            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="What are you working on? (optional)"
            />

            <button
              onClick={handleStart}
              disabled={isStarting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Play className="h-5 w-5" />
              {isStarting ? "Starting..." : "Start Timer"}
            </button>
          </div>
        ) : (
          <div className="mt-8">
            <button
              onClick={handleStop}
              disabled={isStopping}
              className="inline-flex items-center gap-2 rounded-full bg-destructive px-8 py-3 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              <Square className="h-5 w-5" />
              {isStopping ? "Stopping..." : "Stop Timer"}
            </button>
          </div>
        )}
      </div>

      {/* Recent entries */}
      <div className="mt-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Entries
          </h2>
        </div>
        <RecentEntries orgId={orgId} />
      </div>
    </div>
  );
}

function RecentEntries({ orgId }: { orgId: string }) {
  const { isAdmin } = useOrg();
  const { data: entries } = useQuery({
    queryKey: ["time-entries", orgId, "recent"],
    queryFn: () =>
      api.get<
        {
          id: string;
          description: string | null;
          startTime: string;
          duration: number | null;
          user: { firstName: string };
          project: { name: string; color: string };
          task: { title: string } | null;
        }[]
      >(`/orgs/${orgId}/time-entries`, { limit: "10" }),
    enabled: !!orgId,
  });

  return (
    <div className="divide-y divide-border">
      {entries?.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.project.color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">
                {isAdmin && entry.user && (
                  <span className="text-primary mr-1.5">
                    {entry.user.firstName}
                  </span>
                )}
                {entry.project.name}
                {entry.task && (
                  <span className="text-muted-foreground">
                    {" / "}
                    {entry.task.title}
                  </span>
                )}
              </p>
              {entry.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.description}
                </p>
              )}
            </div>
          </div>
          <span className="text-sm font-medium text-card-foreground whitespace-nowrap">
            {entry.duration ? formatDuration(entry.duration) : "Running..."}
          </span>
        </div>
      ))}
      {(!entries || entries.length === 0) && (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          No time entries yet. Start your first timer above!
        </p>
      )}
    </div>
  );
}
