import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { LogActivityDto } from './dto/log-activity.dto';
import { QueryActivityDto } from './dto/query-activity.dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Activity')
@Controller('orgs/:orgId/activity')
@UseGuards(OrgMembershipGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Post()
  logBatch(
    @CurrentUser('id') userId: string,
    @Body() dto: LogActivityDto,
  ) {
    return this.activityService.logBatch(userId, dto);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  getUserActivity(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Query() query: QueryActivityDto,
  ) {
    return this.activityService.getUserActivity(orgId, userId, query);
  }

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  getSummary(
    @Param('orgId') orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.activityService.getSummary(orgId, startDate, endDate);
  }
}
