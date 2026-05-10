"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { api } from "@/lib/api-client";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

type OrgRole = "OWNER" | "ADMIN" | "MEMBER";

interface OrgMember {
  userId: string;
  role: OrgRole;
}

interface OrgContextType {
  orgId: string;
  org: Organization | null;
  isLoading: boolean;
  myRole: OrgRole | null;
  isAdmin: boolean;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const orgId = params.orgId as string;
  const { user } = useAuth();

  const { data: org, isLoading } = useQuery({
    queryKey: ["org", orgId],
    queryFn: () => api.get<Organization>(`/orgs/${orgId}`),
    enabled: !!orgId,
  });

  const { data: members } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => api.get<OrgMember[]>(`/orgs/${orgId}/members`),
    enabled: !!orgId,
  });

  const myRole = members?.find((m) => m.userId === user?.id)?.role ?? null;
  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";

  return (
    <OrgContext.Provider value={{ orgId, org: org ?? null, isLoading, myRole, isAdmin }}>
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
