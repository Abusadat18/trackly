import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TimeEntryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateManualRequestDto } from './dto/create-request.dto';

@Injectable()
export class ManualRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateManualRequestDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, orgId },
    });
    if (!project) throw new NotFoundException('Project not found in this organization');

    if (dto.taskId) {
      const task = await this.prisma.task.findFirst({
        where: { id: dto.taskId, projectId: dto.projectId },
      });
      if (!task) throw new NotFoundException('Task not found in this project');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    return this.prisma.manualEntryRequest.create({
      data: {
        userId,
        orgId,
        projectId: dto.projectId,
        taskId: dto.taskId,
        description: dto.description,
        reason: dto.reason,
        startTime,
        endTime,
        duration,
      },
      include: {
        project: { select: { name: true, color: true } },
        task: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findAll(orgId: string, userId?: string) {
    const where: any = { orgId };
    if (userId) where.userId = userId;

    return this.prisma.manualEntryRequest.findMany({
      where,
      include: {
        project: { select: { name: true, color: true } },
        task: { select: { title: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(orgId: string, requestId: string, reviewerId: string) {
    const request = await this.prisma.manualEntryRequest.findFirst({
      where: { id: requestId, orgId },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Request has already been ${request.status.toLowerCase()}`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.manualEntryRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });

      const timeEntry = await tx.timeEntry.create({
        data: {
          userId: request.userId,
          projectId: request.projectId,
          taskId: request.taskId,
          type: TimeEntryType.MANUAL,
          description: request.description,
          startTime: request.startTime,
          endTime: request.endTime,
          duration: request.duration,
        },
        include: {
          project: { select: { name: true, color: true } },
          task: { select: { title: true } },
        },
      });

      return timeEntry;
    });
  }

  async reject(orgId: string, requestId: string, reviewerId: string, reason?: string) {
    const request = await this.prisma.manualEntryRequest.findFirst({
      where: { id: requestId, orgId },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Request has already been ${request.status.toLowerCase()}`);
    }

    return this.prisma.manualEntryRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectReason: reason,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        project: { select: { name: true, color: true } },
      },
    });
  }

  async getPendingCount(orgId: string) {
    return this.prisma.manualEntryRequest.count({
      where: { orgId, status: 'PENDING' },
    });
  }
}
