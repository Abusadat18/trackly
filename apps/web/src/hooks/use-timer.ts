"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface ActiveTimer {
  id: string;
  projectId: string;
  taskId?: string;
  description?: string;
  startTime: string;
  project: { name: string; color: string };
  task?: { title: string };
}

export function useTimer(orgId: string) {
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: activeTimer, isLoading } = useQuery({
    queryKey: ["active-timer", orgId],
    queryFn: () => api.get<ActiveTimer | null>(`/orgs/${orgId}/time-entries/active`),
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (activeTimer) {
      const start = new Date(activeTimer.startTime).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer]);

  const startMutation = useMutation({
    mutationFn: (data: { projectId: string; taskId?: string; description?: string }) =>
      api.post(`/orgs/${orgId}/time-entries/start`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["active-timer", orgId] }),
  });

  const stopMutation = useMutation({
    mutationFn: (entryId: string) =>
      api.patch(`/orgs/${orgId}/time-entries/${entryId}/stop`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-timer", orgId] });
      queryClient.invalidateQueries({ queryKey: ["time-entries", orgId] });
    },
  });

  const start = useCallback(
    (data: { projectId: string; taskId?: string; description?: string }) =>
      startMutation.mutateAsync(data),
    [startMutation],
  );

  const stop = useCallback(
    () => {
      if (activeTimer) return stopMutation.mutateAsync(activeTimer.id);
    },
    [activeTimer, stopMutation],
  );

  return {
    activeTimer,
    elapsed,
    isLoading,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending,
    start,
    stop,
  };
}
