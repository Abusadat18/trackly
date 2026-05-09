import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { StartTimerDto } from './dto/start-timer.dto';
import { ManualEntryDto } from './dto/manual-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { QueryEntriesDto } from './dto/query-entries.dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Time Entries')
@Controller('orgs/:orgId/time-entries')
@UseGuards(OrgMembershipGuard)
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Post('start')
  startTimer(
    @Param('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: StartTimerDto,
  ) {
    return this.timeEntriesService.startTimer(orgId, userId, dto);
  }

  @Patch(':id/stop')
  stopTimer(
    @Param('orgId') orgId: string,
    @Param('id') entryId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.timeEntriesService.stopTimer(orgId, userId, entryId);
  }

  @Post('manual')
  createManualEntry(
    @Param('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ManualEntryDto,
  ) {
    return this.timeEntriesService.createManualEntry(orgId, userId, dto);
  }

  @Get('active')
  getActiveTimer(@CurrentUser('id') userId: string) {
    return this.timeEntriesService.getActiveTimer(userId);
  }

  @Get()
  findAll(@Param('orgId') orgId: string, @Query() query: QueryEntriesDto) {
    return this.timeEntriesService.findAll(orgId, query);
  }

  @Patch(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') entryId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.timeEntriesService.update(orgId, userId, entryId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  remove(@Param('id') entryId: string) {
    return this.timeEntriesService.remove(entryId);
  }
}
