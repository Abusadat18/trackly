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
import { OrganizationsService } from './organizations.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Organizations')
@Controller('orgs')
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrgDto, @CurrentUser('id') userId: string) {
    return this.orgsService.create(dto, userId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.orgsService.findAllForUser(userId);
  }

  @Get(':orgId')
  @UseGuards(OrgMembershipGuard)
  findOne(@Param('orgId') orgId: string) {
    return this.orgsService.findOne(orgId);
  }

  @Patch(':orgId')
  @UseGuards(OrgMembershipGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  update(@Param('orgId') orgId: string, @Body() dto: UpdateOrgDto) {
    return this.orgsService.update(orgId, dto);
  }

  @Delete(':orgId')
  @UseGuards(OrgMembershipGuard)
  remove(@Param('orgId') orgId: string, @CurrentUser('id') userId: string) {
    return this.orgsService.remove(orgId, userId);
  }

  @Get(':orgId/members')
  @UseGuards(OrgMembershipGuard)
  getMembers(@Param('orgId') orgId: string) {
    return this.orgsService.getMembers(orgId);
  }

  @Patch(':orgId/members/:userId')
  @UseGuards(OrgMembershipGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.orgsService.updateMemberRole(orgId, memberId, dto.role);
  }

  @Delete(':orgId/members/:userId')
  @UseGuards(OrgMembershipGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  removeMember(
    @Param('orgId') orgId: string,
    @Param('userId') memberId: string,
  ) {
    return this.orgsService.removeMember(orgId, memberId);
  }
}
