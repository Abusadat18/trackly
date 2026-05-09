import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, projectId: string, dto: CreateTaskDto) {
    await this.verifyProjectBelongsToOrg(orgId, projectId);

    return this.prisma.task.create({
      data: { ...dto, projectId },
    });
  }

  async findAll(orgId: string, projectId: string) {
    await this.verifyProjectBelongsToOrg(orgId, projectId);

    return this.prisma.task.findMany({
      where: { projectId },
      include: { _count: { select: { timeEntries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(orgId: string, projectId: string, taskId: string, dto: UpdateTaskDto) {
    await this.verifyProjectBelongsToOrg(orgId, projectId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id: taskId },
      data: dto,
    });
  }

  async remove(orgId: string, projectId: string, taskId: string) {
    await this.verifyProjectBelongsToOrg(orgId, projectId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Task deleted' };
  }

  private async verifyProjectBelongsToOrg(orgId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
    });
    if (!project) throw new NotFoundException('Project not found');
  }
}
