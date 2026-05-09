"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface Org {
  id: string;
  name: string;
  slug: string;
}

export default function OrgSelectorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [orgName, setOrgName] = useState("");

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => api.get<Org[]>("/orgs"),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<Org>("/orgs", { name }),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      toast.success("Organization created");
      router.push(`/org/${org.id}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (orgName.trim()) createMutation.mutate(orgName.trim());
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">
        Select an Organization
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose an organization or create a new one
      </p>

      <div className="mt-8 w-full max-w-md space-y-3">
        {orgs?.map((org) => (
          <button
            key={org.id}
            onClick={() => router.push(`/org/${org.id}`)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {org.name[0].toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-card-foreground">
                  {org.name}
                </p>
                <p className="text-xs text-muted-foreground">{org.slug}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}

        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create New Organization
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <label className="block text-sm font-medium text-card-foreground">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="My Company"
              autoFocus
            />
            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
