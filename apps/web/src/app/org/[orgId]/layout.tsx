"use client";

import { OrgProvider, useOrg } from "@/providers/org-provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { orgId, org } = useOrg();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar orgId={orgId} orgName={org?.name} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrgProvider>
      <DashboardShell>{children}</DashboardShell>
    </OrgProvider>
  );
}
