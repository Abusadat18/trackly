import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, dto: CreateProjectDto) {
    const existing = await this.prisma.project.findUnique({
      where: { orgId_name: { orgId, name: dto.name } },
    });
    if (existing) throw new ConflictException('Project name already exists in this organization');

    return this.prisma.project.create({
      data: { ...dto, orgId },
      include: { _count: { select: { tasks: true, timeEntries: true } } },
    });
  }

  async findAll(orgId: string, includeArchived = false) {
    return this.prisma.project.findMany({
      where: {
        orgId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: { _count: { select: { tasks: true, timeEntries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(orgId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, orgId },
      include: {
        _count: { select: { tasks: true, timeEntries: true } },
        tasks: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(orgId: string, projectId: string, dto: UpdateProjectDto) {
    await this.findOne(orgId, projectId);

    if (dto.name) {
      const existing = await this.prisma.project.findFirst({
        where: { orgId, name: dto.name, id: { not: projectId } },
      });
      if (existing) throw new ConflictException('Project name already exists');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async remove(orgId: string, projectId: string) {
    await this.findOne(orgId, projectId);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { isArchived: true },
    });
    return { message: 'Project archived' };
  }
}
