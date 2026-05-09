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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Roles } from '../../common/decorators';
import { OrgMembershipGuard, RolesGuard } from '../../common/guards';

@ApiTags('Tasks')
@Controller('orgs/:orgId/projects/:projectId/tasks')
@UseGuards(OrgMembershipGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(orgId, projectId, dto);
  }

  @Get()
  findAll(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findAll(orgId, projectId);
  }

  @Patch(':taskId')
  update(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(orgId, projectId, taskId, dto);
  }

  @Delete(':taskId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'ADMIN')
  remove(
    @Param('orgId') orgId: string,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.remove(orgId, projectId, taskId);
  }
}
