import { Injectable, Logger } from '@nestjs/common';
import { OllamaProvider, AiAnalysisResult } from './ollama.provider';
import { MockAiProvider } from './mock-ai.provider';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private cache = new Map<string, { result: AiAnalysisResult; expiresAt: number }>();

  constructor(
    private ollama: OllamaProvider,
    private mockAi: MockAiProvider,
    private reports: ReportsService,
  ) {}

  async analyze(orgId: string, startDate?: string, endDate?: string): Promise<AiAnalysisResult> {
    const [userSummary, projectSummary, productivity] = await Promise.all([
      this.reports.getUserSummary(orgId, startDate, endDate),
      this.reports.getProjectSummary(orgId, startDate, endDate),
      this.reports.getProductivitySummary(orgId, startDate, endDate),
    ]);

    const data = { userSummary, projectSummary, productivity };

    try {
      const healthy = await this.ollama.isHealthy();
      if (!healthy) throw new Error('Ollama not available');

      const prompt = this.buildPrompt(data);
      this.logger.log('Sending analysis request to Ollama');
      const result = await this.ollama.analyze(prompt);

      if (!result.insights.length) {
        result.insights = this.mockAi.analyze(data).insights;
      }
      if (!result.recommendations.length) {
        result.recommendations = this.mockAi.analyze(data).recommendations;
      }

      this.cacheResult(orgId, result);
      return result;
    } catch (err: any) {
      this.logger.warn(`Ollama unavailable, using mock provider: ${err?.message}`);
      const result = this.mockAi.analyze(data);
      this.cacheResult(orgId, result);
      return result;
    }
  }

  getInsights(orgId: string): AiAnalysisResult | null {
    const cached = this.cache.get(orgId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
    this.cache.delete(orgId);
    return null;
  }

  async checkHealth(): Promise<{ ollama: boolean; provider: string }> {
    const ollamaHealthy = await this.ollama.isHealthy();
    return {
      ollama: ollamaHealthy,
      provider: ollamaHealthy ? 'ollama' : 'mock',
    };
  }

  private cacheResult(orgId: string, result: AiAnalysisResult) {
    this.cache.set(orgId, {
      result,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
  }

  private buildPrompt(data: {
    userSummary: any[];
    projectSummary: any[];
    productivity: any;
  }): string {
    const userLines = data.userSummary
      .slice(0, 10)
      .map(
        (u) =>
          `- ${u.user.firstName} ${u.user.lastName}: ${u.totalHours}h (${u.entryCount} entries)`,
      )
      .join('\n');

    const projectLines = data.projectSummary
      .slice(0, 10)
      .map(
        (p) =>
          `- ${p.projectName}: ${p.totalHours}h (${p.uniqueContributors} contributors)`,
      )
      .join('\n');

    const categoryLines = data.productivity.categoryBreakdown
      .map((c: any) => `- ${c.category}: ${c.percentage}%`)
      .join('\n');

    return `

    Team Members (hours tracked):
    ${userLines || '- No data available'}

    Projects (hours tracked):
    ${projectLines || '- No data available'}

    Activity Categories:
    ${categoryLines || '- No data available'}

    Daily average: ${
          data.productivity.dailyTrend.length > 0
            ? (
                data.productivity.dailyTrend.reduce((s: number, d: any) => s + d.totalHours, 0) /
                data.productivity.dailyTrend.length
              ).toFixed(1) + 'h'
            : 'N/A'
        }
      `;
  }
}
