import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ManualRequestsService } from './manual-requests.service';
import { CreateManualRequestDto } from './dto/create-request.dto';
import { RejectRequestDto } from './dto/review-request.dto';
import { CurrentUser, OrgMembership, Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Manual Entry Requests')
@Controller('orgs/:orgId/manual-requests')
@UseGuards(OrgMembershipGuard)
export class ManualRequestsController {
  constructor(private readonly service: ManualRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a manual time entry request' })
  create(
    @Param('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateManualRequestDto,
  ) {
    return this.service.create(orgId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List manual entry requests' })
  findAll(
    @Param('orgId') orgId: string,
    @OrgMembership() membership: { role: string; userId: string },
  ) {
    const userId = membership.role === 'MEMBER' ? membership.userId : undefined;
    return this.service.findAll(orgId, userId);
  }

  @Get('pending-count')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @ApiOperation({ summary: 'Get count of pending requests' })
  getPendingCount(@Param('orgId') orgId: string) {
    return this.service.getPendingCount(orgId);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @ApiOperation({ summary: 'Approve a manual entry request' })
  approve(
    @Param('orgId') orgId: string,
    @Param('id') requestId: string,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.service.approve(orgId, requestId, reviewerId);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  @ApiOperation({ summary: 'Reject a manual entry request' })
  reject(
    @Param('orgId') orgId: string,
    @Param('id') requestId: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: RejectRequestDto,
  ) {
    return this.service.reject(orgId, requestId, reviewerId, dto.reason);
  }
}
