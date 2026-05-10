import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { OrgMembership, Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Reports')
@Controller('orgs/:orgId/reports')
@UseGuards(OrgMembershipGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  private scopeUserId(membership: { role: string; userId: string }): string | undefined {
    return membership.role === 'MEMBER' ? membership.userId : undefined;
  }

  @Get('team-summary')
  getTeamSummary(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
    @OrgMembership() membership: { role: string; userId: string },
  ) {
    return this.reportsService.getTeamSummary(
      orgId,
      query.startDate,
      query.endDate,
      this.scopeUserId(membership),
    );
  }

  @Get('user-summary')
  getUserSummary(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
    @OrgMembership() membership: { role: string; userId: string },
  ) {
    return this.reportsService.getUserSummary(
      orgId,
      query.startDate,
      query.endDate,
      this.scopeUserId(membership),
    );
  }

  @Get('project-summary')
  getProjectSummary(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
    @OrgMembership() membership: { role: string; userId: string },
  ) {
    return this.reportsService.getProjectSummary(
      orgId,
      query.startDate,
      query.endDate,
      this.scopeUserId(membership),
    );
  }

  @Get('productivity')
  getProductivitySummary(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
    @OrgMembership() membership: { role: string; userId: string },
  ) {
    return this.reportsService.getProductivitySummary(
      orgId,
      query.startDate,
      query.endDate,
      this.scopeUserId(membership),
    );
  }
}
