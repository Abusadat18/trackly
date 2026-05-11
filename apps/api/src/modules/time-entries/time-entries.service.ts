import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TimeEntryType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StartTimerDto } from './dto/start-timer.dto';
import { ManualEntryDto } from './dto/manual-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { QueryEntriesDto } from './dto/query-entries.dto';

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  async startTimer(orgId: string, userId: string, dto: StartTimerDto) {
    await this.verifyProjectInOrg(orgId, dto.projectId);
    if (dto.taskId) {
      await this.verifyTaskInProject(dto.projectId, dto.taskId);
    }

    // Enforce single active timer per user
    const active = await this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });
    if (active) {
      throw new BadRequestException(
        'You already have a running timer. Stop it before starting a new one.',
      );
    }

    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: dto.projectId,
        taskId: dto.taskId,
        description: dto.description,
        type: TimeEntryType.TIMER,
        startTime: new Date(),
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  async stopTimer(orgId: string, userId: string, entryId: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) throw new NotFoundException('Time entry not found');
    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only stop your own timer');
    }
    if (entry.endTime) {
      throw new BadRequestException('Timer is already stopped');
    }

    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - entry.startTime.getTime()) / 1000,
    );

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: { endTime, duration },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  async createManualEntry(orgId: string, userId: string, dto: ManualEntryDto) {
    await this.verifyProjectInOrg(orgId, dto.projectId);
    if (dto.taskId) {
      await this.verifyTaskInProject(dto.projectId, dto.taskId);
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000,
    );

    return this.prisma.timeEntry.create({
      data: {
        userId,
        projectId: dto.projectId,
        taskId: dto.taskId,
        description: dto.description,
        type: TimeEntryType.MANUAL,
        startTime,
        endTime,
        duration,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  async getActiveTimer(userId: string) {
    const active = await this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, title: true } },
      },
    });
    return active;
  }

  async findAll(orgId: string, query: QueryEntriesDto) {
    const where: any = {
      project: { orgId },
    };

    if (query.userId) where.userId = query.userId;
    if (query.projectId) where.projectId = query.projectId;
    if (query.taskId) where.taskId = query.taskId;

    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) where.startTime.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (query.endDate.length === 10) end.setHours(23, 59, 59, 999);
        where.startTime.lte = end;
      }
    }

    const [entries, total] = await Promise.all([
      this.prisma.timeEntry.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          project: { select: { id: true, name: true, color: true } },
          task: { select: { id: true, title: true } },
        },
        orderBy: { startTime: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.timeEntry.count({ where }),
    ]);

    return {
      data: entries,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async update(orgId: string, userId: string, entryId: string, dto: UpdateEntryDto) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Time entry not found');
    if (entry.userId !== userId) {
      throw new ForbiddenException('You can only edit your own entries');
    }

    if (dto.projectId) await this.verifyProjectInOrg(orgId, dto.projectId);
    if (dto.taskId && (dto.projectId || entry.projectId)) {
      await this.verifyTaskInProject(dto.projectId || entry.projectId, dto.taskId);
    }

    const updateData: any = { ...dto };

    if (dto.startTime) updateData.startTime = new Date(dto.startTime);
    if (dto.endTime) updateData.endTime = new Date(dto.endTime);

    // Recompute duration if times changed
    const startTime = updateData.startTime || entry.startTime;
    const endTime = updateData.endTime || entry.endTime;
    if (startTime && endTime) {
      updateData.duration = Math.floor(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000,
      );
    }

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, color: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }

  async remove(entryId: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundException('Time entry not found');

    await this.prisma.timeEntry.delete({ where: { id: entryId } });
    return { message: 'Time entry deleted' };
  }

  private async verifyProjectInOrg(orgId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
    });
    if (!project) throw new NotFoundException('Project not found in this organization');
  }

  private async verifyTaskInProject(projectId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) throw new NotFoundException('Task not found in this project');
  }
}
