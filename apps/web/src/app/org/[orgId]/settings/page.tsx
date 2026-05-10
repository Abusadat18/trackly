"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/providers/org-provider";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { orgId, org, isAdmin } = useOrg();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(org?.name ?? "");

  if (!isAdmin) {
    router.replace(`/org/${orgId}`);
    return null;
  }

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      api.patch(`/orgs/${orgId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", orgId] });
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast.success("Organization updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your organization settings
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground">General</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) updateMutation.mutate({ name: name.trim() });
          }}
          className="mt-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-card-foreground">
              Organization Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground">
              Slug
            </label>
            <input
              type="text"
              value={org?.slug ?? ""}
              disabled
              className="mt-1 block w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
