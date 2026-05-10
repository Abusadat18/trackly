import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto, UpdateTeamMemberRoleDto } from './dto/add-member.dto';
import { OrgMembership, Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Teams')
@Controller('orgs/:orgId/teams')
@UseGuards(OrgMembershipGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  create(@Param('orgId') orgId: string, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(orgId, dto);
  }

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @OrgMembership() membership: { role: string; userId: string },
  ) {
    const userId = membership.role === 'MEMBER' ? membership.userId : undefined;
    return this.teamsService.findAll(orgId, userId);
  }

  @Get(':teamId')
  findOne(@Param('orgId') orgId: string, @Param('teamId') teamId: string) {
    return this.teamsService.findOne(orgId, teamId);
  }

  @Patch(':teamId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  update(
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(orgId, teamId, dto);
  }

  @Delete(':teamId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  remove(@Param('orgId') orgId: string, @Param('teamId') teamId: string) {
    return this.teamsService.remove(orgId, teamId);
  }

  @Post(':teamId/members')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  addMember(
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(orgId, teamId, dto.userId, dto.role);
  }

  @Patch(':teamId/members/:userId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTeamMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(orgId, teamId, userId, dto.role);
  }

  @Delete(':teamId/members/:userId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  removeMember(
    @Param('orgId') orgId: string,
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
  ) {
    return this.teamsService.removeMember(orgId, teamId, userId);
  }
}
