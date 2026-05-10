"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Brain,
  Lightbulb,
  Target,
  RefreshCw,
  CheckCircle,
  Cpu,
  AlertCircle,
} from "lucide-react";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface AiResult {
  assessment?: string;
  insights?: string[];
  recommendations?: string[];
  provider?: "ollama" | "mock";
  message?: string;
}

interface HealthStatus {
  ollama: boolean;
  provider: string;
}

export default function AiInsightsPage() {
  const { orgId } = useOrg();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: health } = useQuery({
    queryKey: ["ai-health", orgId],
    queryFn: () => api.get<HealthStatus>(`/orgs/${orgId}/ai/health`),
    enabled: !!orgId,
  });

  const { data: cached } = useQuery({
    queryKey: ["ai-insights", orgId],
    queryFn: () => api.get<AiResult>(`/orgs/${orgId}/ai/insights`),
    enabled: !!orgId,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      return api.post<AiResult>(`/orgs/${orgId}/ai/analyze`, null, params);
    },
    onSuccess: () => toast.success("Analysis complete"),
    onError: (err: Error) => toast.error(err.message),
  });

  const result = analyzeMutation.data || (cached?.assessment ? cached : null);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Get AI-powered analysis of your team&apos;s productivity
          </p>
        </div>

        {/* Provider status */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs">
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Provider:</span>
          <span className="font-medium text-card-foreground">
            {health?.provider === "ollama" ? "Ollama" : "Mock AI"}
          </span>
          <div
            className={`h-2 w-2 rounded-full ${
              health?.ollama ? "bg-green-500" : "bg-amber-500"
            }`}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {analyzeMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {analyzeMutation.isPending ? "Analyzing..." : "Run Analysis"}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && result.assessment && (
        <div className="mt-6 space-y-4">
          {/* Assessment */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">
                Assessment
              </h2>
              {result.provider && (
                <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  via {result.provider}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-card-foreground">
              {result.assessment}
            </p>
          </div>

          {/* Insights */}
          {result.insights && result.insights.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-card-foreground">
                  Key Insights
                </h2>
              </div>
              <ul className="space-y-3">
                {result.insights.map((insight, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-card-foreground">
                      {insight}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-card-foreground">
                  Recommendations
                </h2>
              </div>
              <ul className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-lg bg-muted/50 p-3"
                  >
                    <Target className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <p className="text-sm leading-relaxed text-card-foreground">
                      {rec}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !analyzeMutation.isPending && (
        <div className="mt-12 text-center">
          <Brain className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No analysis yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Click &quot;Run Analysis&quot; to get AI-powered insights about your
            team&apos;s productivity and time tracking patterns.
          </p>
        </div>
      )}

      {/* Loading state */}
      {analyzeMutation.isPending && (
        <div className="mt-12 text-center">
          <RefreshCw className="mx-auto h-12 w-12 text-primary animate-spin" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            Analyzing your data...
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {health?.ollama
              ? "Processing with Ollama AI model"
              : "Running heuristic analysis"}
          </p>
        </div>
      )}

      {/* Error state */}
      {analyzeMutation.isError && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Analysis failed
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {analyzeMutation.error?.message || "Please try again"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
