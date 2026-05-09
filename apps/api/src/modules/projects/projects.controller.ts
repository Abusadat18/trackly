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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Projects')
@Controller('orgs/:orgId/projects')
@UseGuards(OrgMembershipGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  create(@Param('orgId') orgId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(orgId, dto);
  }

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.projectsService.findAll(orgId, includeArchived === 'true');
  }

  @Get(':projectId')
  findOne(@Param('orgId') orgId: string, @Param('projectId') projectId: string) {
    return this.projectsService.findOne(orgId, projectId);
  }

  @Patch(':projectId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  update(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(orgId, projectId, dto);
  }

  @Delete(':projectId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  remove(@Param('orgId') orgId: string, @Param('projectId') projectId: string) {
    return this.projectsService.remove(orgId, projectId);
  }
}
