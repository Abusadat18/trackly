"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Plus,
  Check,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api-client";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";

interface ManualRequest {
  id: string;
  description: string | null;
  reason: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  project: { name: string; color: string };
  task: { title: string } | null;
  reviewedBy: { firstName: string; lastName: string } | null;
}

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

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function TimeRequestsPage() {
  const { orgId, isAdmin, myRole } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = myRole === "OWNER";

  const [showForm, setShowForm] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["manual-requests", orgId],
    queryFn: () => api.get<ManualRequest[]>(`/orgs/${orgId}/manual-requests`),
    enabled: !!orgId,
  });

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

  const createMutation = useMutation({
    mutationFn: (data: {
      projectId: string;
      taskId?: string;
      description?: string;
      reason: string;
      startTime: string;
      endTime: string;
    }) => api.post(`/orgs/${orgId}/manual-requests`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-requests", orgId] });
      resetForm();
      toast.success("Request submitted for approval");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/orgs/${orgId}/manual-requests/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-requests", orgId] });
      toast.success("Request approved — time entry created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/orgs/${orgId}/manual-requests/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-requests", orgId] });
      setRejectId(null);
      setRejectReason("");
      toast.success("Request rejected");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function resetForm() {
    setShowForm(false);
    setProjectId("");
    setTaskId("");
    setDescription("");
    setReason("");
    setStartTime("");
    setEndTime("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !reason.trim() || !startTime || !endTime) return;
    createMutation.mutate({
      projectId,
      taskId: taskId || undefined,
      description: description.trim() || undefined,
      reason: reason.trim(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    });
  }

  const pendingRequests = requests?.filter((r) => r.status === "PENDING") ?? [];
  const pastRequests = requests?.filter((r) => r.status !== "PENDING") ?? [];

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Time Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOwner
              ? "Review and approve manual time entry requests"
              : "Request manual time entries when you missed the timer"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Request form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Project *
              </label>
              <select
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setTaskId("");
                }}
                required
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Select project...</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Task (optional)
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                disabled={!projectId}
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">No task</option>
                {tasks
                  ?.filter((t) => t.status !== "ARCHIVED")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What were you working on?"
              className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Reason for manual entry *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={5}
              rows={2}
              placeholder="Explain why you need a manual entry (e.g., forgot to start the timer)"
              className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-amber-200 bg-card p-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: req.project.color }}
                      />
                      <span className="text-sm font-medium text-card-foreground">
                        {req.project.name}
                        {req.task && (
                          <span className="text-muted-foreground">
                            {" / "}{req.task.title}
                          </span>
                        )}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES.PENDING}`}>
                        Pending
                      </span>
                    </div>
                    {isOwner && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        By {req.user.firstName} {req.user.lastName} ({req.user.email})
                      </p>
                    )}
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="block sm:inline">
                        {new Date(req.startTime).toLocaleString()} — {new Date(req.endTime).toLocaleString()}
                      </span>
                      <span className="ml-0 sm:ml-2 font-medium">({formatDuration(req.duration)})</span>
                    </div>
                    {req.description && (
                      <p className="mt-1 text-sm text-card-foreground">{req.description}</p>
                    )}
                    <div className="mt-2 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground italic">{req.reason}</p>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => approveMutation.mutate(req.id)}
                        disabled={approveMutation.isPending}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectId(req.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 flex items-center gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Reject reason input */}
                {rejectId === req.id && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-end border-t border-border pt-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Rejection reason (optional)
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Why is this request being rejected?"
                        className="block w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          rejectMutation.mutate({
                            id: req.id,
                            reason: rejectReason.trim() || undefined,
                          })
                        }
                        disabled={rejectMutation.isPending}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => {
                          setRejectId(null);
                          setRejectReason("");
                        }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past requests */}
      {pastRequests.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Past Requests
          </h2>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {isOwner && (
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      User
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pastRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/30">
                    {isOwner && (
                      <td className="px-4 py-3 text-card-foreground">
                        {req.user.firstName} {req.user.lastName}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: req.project.color }}
                        />
                        <span className="text-card-foreground">{req.project.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDuration(req.duration)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(req.startTime).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[req.status]}`}
                      >
                        {req.status}
                      </span>
                      {req.rejectReason && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          {req.rejectReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {pastRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: req.project.color }}
                    />
                    <span className="text-sm font-medium text-card-foreground truncate">
                      {req.project.name}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_STYLES[req.status]}`}
                  >
                    {req.status}
                  </span>
                </div>
                {isOwner && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {req.user.firstName} {req.user.lastName}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDuration(req.duration)}</span>
                  <span>{new Date(req.startTime).toLocaleDateString()}</span>
                </div>
                {req.rejectReason && (
                  <p className="mt-1 text-xs text-muted-foreground italic">
                    {req.rejectReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {requests?.length === 0 && (
        <div className="mt-16 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No time requests yet.
            {!isOwner && " Submit a request if you forgot to start your timer."}
          </p>
        </div>
      )}
    </div>
  );
}
