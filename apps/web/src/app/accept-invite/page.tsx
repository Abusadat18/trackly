"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Timer, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api-client";

interface InviteInfo {
  email: string;
  orgName: string;
  inviterName: string;
  role: string;
  status: string;
  expiresAt: string;
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const token = searchParams.get("token") || "";

  const {
    data: info,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["invite-info", token],
    queryFn: () =>
      api.get<InviteInfo>("/invitations/info", { token }),
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.post<{ orgId: string }>("/invitations/accept", { token }),
    onSuccess: (data) => {
      router.push(`/org/${data.orgId}`);
    },
  });

  if (!token) {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-foreground">
            Invalid Invitation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No invitation token provided.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError || !info) {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-foreground">
            Invalid Invitation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {fetchError instanceof Error
              ? fetchError.message
              : "This invitation link is invalid or has expired."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (info.status !== "PENDING") {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-bold text-foreground">
            Invitation {info.status.toLowerCase()}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation has already been {info.status.toLowerCase()}.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const expired = new Date(info.expiresAt) < new Date();
  if (expired) {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold text-foreground">
            Invitation Expired
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation has expired. Please ask the admin to send a new one.
          </p>
        </div>
      </div>
    );
  }

  if (acceptMutation.isSuccess) {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="mt-4 text-xl font-bold text-foreground">
            Welcome to {info.orgName}!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Timer className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 text-xl font-bold text-foreground">Trackly</h1>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
          <h2 className="text-lg font-semibold text-card-foreground">
            You&apos;re invited!
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            <strong>{info.inviterName}</strong> invited you to join{" "}
            <strong>{info.orgName}</strong> as a{" "}
            <span className="font-medium">{info.role}</span>.
          </p>

          {!user ? (
            <div className="mt-6 space-y-2">
              <p className="text-sm text-muted-foreground">
                Please sign in or create an account to accept.
              </p>
              <div className="flex gap-2 justify-center">
                <Link
                  href={`/login?redirect=/accept-invite?token=${token}`}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Sign In
                </Link>
                <Link
                  href={`/signup?redirect=/accept-invite?token=${token}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-3">
                Signed in as {user.email}
              </p>

              {acceptMutation.isError && (
                <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {acceptMutation.error instanceof Error
                    ? acceptMutation.error.message
                    : "Failed to accept invitation"}
                </div>
              )}

              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {acceptMutation.isPending
                  ? "Accepting..."
                  : "Accept Invitation"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
