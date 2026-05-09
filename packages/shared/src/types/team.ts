import { TeamRole } from '../enums';

export interface Team {
  id: string;
  name: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  joinedAt: string;
}

export interface CreateTeamRequest {
  name: string;
}

export interface AddTeamMemberRequest {
  userId: string;
  role?: TeamRole;
}
