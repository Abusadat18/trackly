import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';

@ApiTags('AI')
@Controller('orgs/:orgId/ai')
@UseGuards(OrgMembershipGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze productivity data with AI' })
  async analyze(
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.aiService.analyze(orgId, startDate, endDate);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get cached AI insights' })
  getInsights(@Param('orgId') orgId: string) {
    const insights = this.aiService.getInsights(orgId);
    return insights || { message: 'No cached insights. Run /analyze first.' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check AI provider health' })
  checkHealth() {
    return this.aiService.checkHealth();
  }
}
