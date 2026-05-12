import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, AcceptInvitationDto } from './dto/invitations.dto';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Invitations')
@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('orgs/:orgId/invitations')
  @UseGuards(OrgMembershipGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Send an invitation' })
  create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.create(orgId, user.id, dto);
  }

  @Get('orgs/:orgId/invitations')
  @UseGuards(OrgMembershipGuard)
  @ApiOperation({ summary: 'List pending invitations' })
  listPending(@Param('orgId') orgId: string) {
    return this.invitationsService.listPending(orgId);
  }

  @Delete('orgs/:orgId/invitations/:id')
  @UseGuards(OrgMembershipGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Revoke an invitation' })
  revoke(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.invitationsService.revoke(orgId, id);
  }

  @Get('invitations/my-pending')
  @ApiOperation({ summary: 'List pending invitations for the current user' })
  listMyPending(@CurrentUser() user: any) {
    return this.invitationsService.listMyPending(user.email);
  }

  @Public()
  @Get('invitations/info')
  @ApiOperation({ summary: 'Get invitation details by token (public)' })
  getByToken(@Query('token') token: string) {
    return this.invitationsService.getByToken(token);
  }

  @Post('invitations/accept')
  @ApiOperation({ summary: 'Accept an invitation' })
  accept(@Body() dto: AcceptInvitationDto, @CurrentUser() user: any) {
    return this.invitationsService.accept(dto.token, user.id);
  }
}
