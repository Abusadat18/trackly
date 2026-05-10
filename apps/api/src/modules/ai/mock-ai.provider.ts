import { Injectable } from '@nestjs/common';
import { AiAnalysisResult } from './ollama.provider';

interface AnalysisData {
  userSummary: { user: { firstName: string; lastName: string }; totalHours: number; entryCount: number }[];
  projectSummary: { projectName: string; totalHours: number; uniqueContributors: number }[];
  productivity: {
    categoryBreakdown: { category: string; totalSeconds: number; percentage: number }[];
    totalActivitySeconds: number;
    dailyTrend: { date: string; totalHours: number }[];
  };
}

@Injectable()
export class MockAiProvider {
  analyze(data: AnalysisData): AiAnalysisResult {
    const { userSummary, projectSummary, productivity } = data;

    const totalTeamHours = userSummary.reduce((s, u) => s + u.totalHours, 0);
    const avgHoursPerUser = userSummary.length > 0 ? totalTeamHours / userSummary.length : 0;
    const topUser = userSummary[0];
    const topProject = projectSummary[0];

    const productiveCategory = productivity.categoryBreakdown.find(
      (c) => c.category === 'PRODUCTIVE',
    );
    const distractingCategory = productivity.categoryBreakdown.find(
      (c) => c.category === 'DISTRACTING',
    );

    const productivePct = productiveCategory?.percentage ?? 0;
    const distractingPct = distractingCategory?.percentage ?? 0;

    const dailyHours = productivity.dailyTrend.map((d) => d.totalHours);
    const avgDaily = dailyHours.length > 0
      ? dailyHours.reduce((s, h) => s + h, 0) / dailyHours.length
      : 0;

    let assessment = `Your team has logged a total of ${totalTeamHours.toFixed(1)} hours across ${projectSummary.length} projects. `;

    if (avgHoursPerUser > 6) {
      assessment += `Team members are averaging ${avgHoursPerUser.toFixed(1)} hours each, indicating strong engagement. `;
    } else if (avgHoursPerUser > 3) {
      assessment += `Average hours per member (${avgHoursPerUser.toFixed(1)}h) suggest moderate activity levels. `;
    } else {
      assessment += `Average tracked hours per member (${avgHoursPerUser.toFixed(1)}h) are relatively low — consider encouraging consistent time tracking. `;
    }

    if (productivePct > 70) {
      assessment += `Productivity is excellent at ${productivePct}% productive activity.`;
    } else if (productivePct > 50) {
      assessment += `Productivity is at ${productivePct}%, with room for improvement.`;
    } else if (productivePct > 0) {
      assessment += `Productive activity is at ${productivePct}%, which needs attention.`;
    }

    const insights: string[] = [];

    if (topUser) {
      insights.push(
        `${topUser.user.firstName} ${topUser.user.lastName} is the top contributor with ${topUser.totalHours.toFixed(1)} hours across ${topUser.entryCount} time entries.`,
      );
    }

    if (topProject) {
      insights.push(
        `"${topProject.projectName}" is the most active project with ${topProject.totalHours.toFixed(1)} hours from ${topProject.uniqueContributors} contributors.`,
      );
    }

    if (distractingPct > 20) {
      insights.push(
        `Distracting activity accounts for ${distractingPct}% of monitored time, which is above the recommended threshold.`,
      );
    } else if (distractingPct > 0) {
      insights.push(
        `Distracting activity is well-controlled at ${distractingPct}% of monitored time.`,
      );
    }

    if (avgDaily > 0) {
      insights.push(
        `Daily average tracked time is ${avgDaily.toFixed(1)} hours per day over the analyzed period.`,
      );
    }

    const recommendations: string[] = [];

    if (distractingPct > 25) {
      recommendations.push(
        'Consider implementing focus-time blocks to reduce distracting activity, which currently exceeds 25% of tracked time.',
      );
    }

    const lowTrackers = userSummary.filter((u) => u.totalHours < avgHoursPerUser * 0.5);
    if (lowTrackers.length > 0) {
      recommendations.push(
        `${lowTrackers.length} team member(s) are tracking significantly below average. Consider checking in to ensure time tracking adoption.`,
      );
    }

    if (projectSummary.length > 0) {
      const singleContributor = projectSummary.filter((p) => p.uniqueContributors === 1);
      if (singleContributor.length > 1) {
        recommendations.push(
          `${singleContributor.length} projects have only one contributor. Consider cross-training to reduce key-person dependency.`,
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Continue current practices — the team shows healthy time tracking habits and balanced workload distribution.',
      );
    }

    return {
      assessment,
      insights: insights.slice(0, 5),
      recommendations: recommendations.slice(0, 3),
      provider: 'mock',
    };
  }
}
