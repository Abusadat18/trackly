import { OrgRole } from '../enums';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMembership {
  id: string;
  userId: string;
  orgId: string;
  role: OrgRole;
  joinedAt: string;
}

export interface CreateOrgRequest {
  name: string;
}

export interface UpdateOrgRequest {
  name?: string;
  logoUrl?: string;
}
