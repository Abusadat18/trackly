import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TeamsModule } from './modules/teams/teams.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AiModule } from './modules/ai/ai.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { ManualRequestsModule } from './modules/manual-requests/manual-requests.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    TeamsModule,
    ProjectsModule,
    TasksModule,
    TimeEntriesModule,
    ActivityModule,
    ReportsModule,
    AiModule,
    InvitationsModule,
    ManualRequestsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
