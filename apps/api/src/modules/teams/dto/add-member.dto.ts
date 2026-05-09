import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TeamRole } from '@prisma/client';

export class AddTeamMemberDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}

export class UpdateTeamMemberRoleDto {
  @IsEnum(TeamRole)
  role: TeamRole;
}
