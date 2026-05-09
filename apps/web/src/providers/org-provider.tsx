"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrgContextType {
  orgId: string;
  org: Organization | null;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data: org, isLoading } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => api.get<Organization>(`/orgs/${orgId}`),
    enabled: !!orgId,
  });

  return (
    <OrgContext.Provider value={{ orgId, org: org ?? null, isLoading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
