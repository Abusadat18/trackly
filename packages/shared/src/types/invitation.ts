import { InvitationStatus, OrgRole } from '../enums';

export interface Invitation {
  id: string;
  email: string;
  orgId: string;
  invitedById: string;
  role: OrgRole;
  teamId: string | null;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationRequest {
  email: string;
  role?: OrgRole;
  teamId?: string;
}
