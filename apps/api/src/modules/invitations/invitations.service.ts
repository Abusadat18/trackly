import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  async create(
    orgId: string,
    invitedById: string,
    data: { email: string; role: 'ADMIN' | 'MEMBER'; teamId?: string },
  ) {
    const existing = await this.prisma.orgMembership.findFirst({
      where: {
        orgId,
        user: { email: data.email },
      },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this org');
    }

    const pendingInvite = await this.prisma.invitation.findFirst({
      where: {
        orgId,
        email: data.email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    if (pendingInvite) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: data.email,
        orgId,
        invitedById,
        role: data.role,
        teamId: data.teamId,
        token,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        org: { select: { name: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });

    const corsOrigin = this.config.get<string>('cors.origin') || 'http://localhost:3000';
    const acceptUrl = `${corsOrigin}/accept-invite?token=${token}`;

    await this.email.sendInvitation({
      to: data.email,
      orgName: invitation.org.name,
      inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
      acceptUrl,
    });

    return invitation;
  }

  async listPending(orgId: string) {
    return this.prisma.invitation.findMany({
      where: {
        orgId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(orgId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, orgId, status: 'PENDING' },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });
  }

  async accept(token: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(`Invitation has been ${invitation.status.toLowerCase()}`);
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    const existingMembership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: { userId, orgId: invitation.orgId },
      },
    });
    if (existingMembership) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
      throw new ConflictException('You are already a member of this org');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.orgMembership.create({
        data: {
          userId,
          orgId: invitation.orgId,
          role: invitation.role,
        },
      });

      if (invitation.teamId) {
        await tx.teamMember.create({
          data: {
            userId,
            teamId: invitation.teamId,
            role: 'MEMBER',
          },
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
    });

    return { orgId: invitation.orgId };
  }

  async listMyPending(userEmail: string) {
    return this.prisma.invitation.findMany({
      where: {
        email: userEmail,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        org: { select: { id: true, name: true, slug: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        org: { select: { name: true } },
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation token');
    }

    return {
      email: invitation.email,
      orgName: invitation.org.name,
      inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }
}
