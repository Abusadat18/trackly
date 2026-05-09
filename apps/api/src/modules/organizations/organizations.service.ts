import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrgDto, userId: string) {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new ConflictException('Organization name already taken');
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        ownerId: userId,
        members: {
          create: { userId, role: OrgRole.OWNER },
        },
      },
      include: { _count: { select: { members: true } } },
    });

    return org;
  }

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId },
      include: {
        org: {
          include: { _count: { select: { members: true, projects: true } } },
        },
      },
    });
    return memberships.map((m) => ({
      ...m.org,
      role: m.role,
    }));
  }

  async findOne(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: { members: true, projects: true, teams: true },
        },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, dto: UpdateOrgDto) {
    let slug: string | undefined;
    if (dto.name) {
      slug = this.generateSlug(dto.name);
      const existing = await this.prisma.organization.findFirst({
        where: { slug, id: { not: orgId } },
      });
      if (existing) throw new ConflictException('Organization name already taken');
    }

    return this.prisma.organization.update({
      where: { id: orgId },
      data: { ...dto, ...(slug && { slug }) },
    });
  }

  async remove(orgId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) throw new NotFoundException('Organization not found');
    if (org.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can delete the organization');
    }

    await this.prisma.organization.delete({ where: { id: orgId } });
    return { message: 'Organization deleted' };
  }

  async getMembers(orgId: string) {
    return this.prisma.orgMembership.findMany({
      where: { orgId },
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
    });
  }

  async updateMemberRole(orgId: string, memberId: string, role: OrgRole) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: memberId, orgId } },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    return this.prisma.orgMembership.update({
      where: { id: membership.id },
      data: { role },
    });
  }

  async removeMember(orgId: string, memberId: string) {
    const membership = await this.prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId: memberId, orgId } },
    });
    if (!membership) throw new NotFoundException('Member not found');
    if (membership.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot remove the owner');
    }

    // Also remove from all teams in this org
    const teams = await this.prisma.team.findMany({
      where: { orgId },
      select: { id: true },
    });
    const teamIds = teams.map((t) => t.id);

    await this.prisma.teamMember.deleteMany({
      where: { userId: memberId, teamId: { in: teamIds } },
    });

    await this.prisma.orgMembership.delete({ where: { id: membership.id } });
    return { message: 'Member removed' };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
