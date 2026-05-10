import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateTeamDto) {
    const existing = await this.prisma.team.findUnique({
      where: { orgId_name: { orgId, name: dto.name } },
    });
    if (existing) throw new ConflictException('Team name already exists in this organization');

    return this.prisma.team.create({
      data: { name: dto.name, orgId },
      include: { _count: { select: { members: true } } },
    });
  }

  async findAll(orgId: string, userId?: string) {
    const where: any = { orgId };
    if (userId) {
      where.members = { some: { userId } };
    }

    return this.prisma.team.findMany({
      where,
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async findOne(orgId: string, teamId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, orgId },
      include: {
        _count: { select: { members: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async update(orgId: string, teamId: string, dto: UpdateTeamDto) {
    await this.findOne(orgId, teamId);

    if (dto.name) {
      const existing = await this.prisma.team.findFirst({
        where: { orgId, name: dto.name, id: { not: teamId } },
      });
      if (existing) throw new ConflictException('Team name already exists');
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: dto,
    });
  }

  async remove(orgId: string, teamId: string) {
    await this.findOne(orgId, teamId);
    await this.prisma.team.delete({ where: { id: teamId } });
    return { message: 'Team deleted' };
  }

  async addMember(orgId: string, teamId: string, userId: string, role: TeamRole = TeamRole.MEMBER) {
    await this.findOne(orgId, teamId);

    // Verify user is an org member
    const orgMembership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!orgMembership) {
      throw new BadRequestException('User is not a member of this organization');
    }

    const existing = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (existing) throw new ConflictException('User is already a team member');

    return this.prisma.teamMember.create({
      data: { userId, teamId, role },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async updateMemberRole(orgId: string, teamId: string, userId: string, role: TeamRole) {
    await this.findOne(orgId, teamId);

    const member = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) throw new NotFoundException('Team member not found');

    return this.prisma.teamMember.update({
      where: { id: member.id },
      data: { role },
    });
  }

  async removeMember(orgId: string, teamId: string, userId: string) {
    await this.findOne(orgId, teamId);

    const member = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    if (!member) throw new NotFoundException('Team member not found');

    await this.prisma.teamMember.delete({ where: { id: member.id } });
    return { message: 'Member removed from team' };
  }
}
