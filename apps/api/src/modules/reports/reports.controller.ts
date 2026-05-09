import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Reports')
@Controller('orgs/:orgId/reports')
@UseGuards(OrgMembershipGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('team-summary')
  getTeamSummary(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getTeamSummary(
      orgId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('user-summary')
  getUserSummary(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getUserSummary(
      orgId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('project-summary')
  getProjectSummary(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getProjectSummary(
      orgId,
      query.startDate,
      query.endDate,
    );
  }

  @Get('productivity')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  getProductivitySummary(
    @Param('orgId') orgId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getProductivitySummary(
      orgId,
      query.startDate,
      query.endDate,
    );
  }
}
