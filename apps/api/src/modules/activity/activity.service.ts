import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogActivityDto } from './dto/log-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async logBatch(userId: string, dto: LogActivityDto) {
    const data = dto.activities.map((a) => ({
      userId,
      appName: a.appName,
      windowTitle: a.windowTitle,
      url: a.url,
      category: a.category,
      durationSecs: a.durationSecs,
      recordedAt: new Date(a.recordedAt),
      timeEntryId: a.timeEntryId,
    }));

    const result = await this.prisma.activityLog.createMany({ data });
    return { created: result.count };
  }

  async getUserActivity(
    orgId: string,
    userId: string,
    query: QueryActivityDto,
  ) {
    const where: any = { userId };

    if (query.startDate || query.endDate) {
      where.recordedAt = {};
      if (query.startDate) where.recordedAt.gte = new Date(query.startDate);
      if (query.endDate) where.recordedAt.lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { total, page: query.page, limit: query.limit },
    };
  }

  async getSummary(orgId: string, startDate?: string, endDate?: string) {
    // Get all users in the org
    const memberships = await this.prisma.orgMembership.findMany({
      where: { orgId },
      select: { userId: true },
    });
    const userIds = memberships.map((m) => m.userId);

    const where: any = { userId: { in: userIds } };
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }

    const logs = await this.prisma.activityLog.groupBy({
      by: ['appName', 'category'],
      where,
      _sum: { durationSecs: true },
      _count: true,
      orderBy: { _sum: { durationSecs: 'desc' } },
      take: 20,
    });

    // Category breakdown
    const categoryBreakdown = await this.prisma.activityLog.groupBy({
      by: ['category'],
      where,
      _sum: { durationSecs: true },
    });

    return {
      topApps: logs.map((l) => ({
        appName: l.appName,
        category: l.category,
        totalSeconds: l._sum.durationSecs,
        count: l._count,
      })),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        totalSeconds: c._sum.durationSecs,
      })),
    };
  }
}
