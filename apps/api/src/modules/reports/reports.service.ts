import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getTeamSummary(orgId: string, startDate?: string, endDate?: string, userId?: string) {
    const teamWhere: any = { orgId };
    if (userId) {
      teamWhere.members = { some: { userId } };
    }

    const teams = await this.prisma.team.findMany({
      where: teamWhere,
      include: {
        members: {
          select: { userId: true, role: true },
        },
      },
    });

    const dateFilter = this.buildDateFilter(startDate, endDate);

    const results = await Promise.all(
      teams.map(async (team) => {
        const memberUserIds = userId
          ? [userId]
          : team.members.map((m) => m.userId);

        const aggregate = await this.prisma.timeEntry.aggregate({
          where: {
            userId: { in: memberUserIds },
            project: { orgId },
            endTime: { not: null },
            ...dateFilter,
          },
          _sum: { duration: true },
          _count: true,
        });

        return {
          teamId: team.id,
          teamName: team.name,
          memberCount: team.members.length,
          totalSeconds: aggregate._sum.duration || 0,
          totalHours: Number(((aggregate._sum.duration || 0) / 3600).toFixed(2)),
          entryCount: aggregate._count,
        };
      }),
    );

    return results;
  }

  async getUserSummary(orgId: string, startDate?: string, endDate?: string, userId?: string) {
    const memberWhere: any = { orgId };
    if (userId) memberWhere.userId = userId;

    const members = await this.prisma.orgMembership.findMany({
      where: memberWhere,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
    });

    const dateFilter = this.buildDateFilter(startDate, endDate);

    const results = await Promise.all(
      members.map(async (member) => {
        const aggregate = await this.prisma.timeEntry.aggregate({
          where: {
            userId: member.userId,
            project: { orgId },
            endTime: { not: null },
            ...dateFilter,
          },
          _sum: { duration: true },
          _count: true,
        });

        return {
          user: member.user,
          role: member.role,
          totalSeconds: aggregate._sum.duration || 0,
          totalHours: Number(((aggregate._sum.duration || 0) / 3600).toFixed(2)),
          entryCount: aggregate._count,
        };
      }),
    );

    return results.sort((a, b) => b.totalSeconds - a.totalSeconds);
  }

  async getProjectSummary(orgId: string, startDate?: string, endDate?: string, userId?: string) {
    const projects = await this.prisma.project.findMany({
      where: { orgId, isArchived: false },
    });

    const dateFilter = this.buildDateFilter(startDate, endDate);

    const results = await Promise.all(
      projects.map(async (project) => {
        const entryWhere: any = {
          projectId: project.id,
          endTime: { not: null },
          ...dateFilter,
        };
        if (userId) entryWhere.userId = userId;

        const aggregate = await this.prisma.timeEntry.aggregate({
          where: entryWhere,
          _sum: { duration: true },
          _count: true,
        });

        const uniqueUsers = await this.prisma.timeEntry.findMany({
          where: entryWhere,
          select: { userId: true },
          distinct: ['userId'],
        });

        return {
          projectId: project.id,
          projectName: project.name,
          color: project.color,
          totalSeconds: aggregate._sum.duration || 0,
          totalHours: Number(((aggregate._sum.duration || 0) / 3600).toFixed(2)),
          entryCount: aggregate._count,
          uniqueContributors: uniqueUsers.length,
        };
      }),
    );

    return results.sort((a, b) => b.totalSeconds - a.totalSeconds);
  }

  async getProductivitySummary(orgId: string, startDate?: string, endDate?: string, userId?: string) {
    const userIds = userId
      ? [userId]
      : (await this.prisma.orgMembership.findMany({
          where: { orgId },
          select: { userId: true },
        })).map((m) => m.userId);

    const dateWhere: any = { userId: { in: userIds } };
    if (startDate || endDate) {
      dateWhere.recordedAt = {};
      if (startDate) dateWhere.recordedAt.gte = new Date(startDate);
      if (endDate) dateWhere.recordedAt.lte = this.endOfDay(endDate);
    }

    const categoryBreakdown = await this.prisma.activityLog.groupBy({
      by: ['category'],
      where: dateWhere,
      _sum: { durationSecs: true },
    });

    const totalActivitySeconds = categoryBreakdown.reduce(
      (sum, c) => sum + (c._sum.durationSecs || 0),
      0,
    );

    // Daily breakdown for trend chart using Prisma (avoids raw SQL complexity)
    const timeFilter: any = {
      userId: { in: userIds },
      project: { orgId },
      endTime: { not: null },
    };
    if (startDate || endDate) {
      timeFilter.startTime = {};
      if (startDate) timeFilter.startTime.gte = new Date(startDate);
      if (endDate) timeFilter.startTime.lte = this.endOfDay(endDate);
    }

    const recentEntries = await this.prisma.timeEntry.findMany({
      where: timeFilter,
      select: { startTime: true, duration: true },
      orderBy: { startTime: 'desc' },
      take: 1000,
    });

    // Group by date in JS
    const dailyMap = new Map<string, number>();
    for (const entry of recentEntries) {
      const date = entry.startTime.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + (entry.duration || 0));
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, totalSeconds]) => ({
        date,
        totalSeconds,
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return {
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        totalSeconds: c._sum.durationSecs || 0,
        percentage: totalActivitySeconds
          ? Number(
              (((c._sum.durationSecs || 0) / totalActivitySeconds) * 100).toFixed(1),
            )
          : 0,
      })),
      totalActivitySeconds,
      dailyTrend,
    };
  }

  private endOfDay(dateStr: string): Date {
    const d = new Date(dateStr);
    if (dateStr.length === 10) {
      d.setHours(23, 59, 59, 999);
    }
    return d;
  }

  private buildDateFilter(startDate?: string, endDate?: string) {
    const filter: any = {};
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.gte = new Date(startDate);
      if (endDate) filter.startTime.lte = this.endOfDay(endDate);
    }
    return filter;
  }
}
