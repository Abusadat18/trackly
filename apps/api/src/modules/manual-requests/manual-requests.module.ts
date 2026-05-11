import { Module } from '@nestjs/common';
import { ManualRequestsController } from './manual-requests.controller';
import { ManualRequestsService } from './manual-requests.service';

@Module({
  controllers: [ManualRequestsController],
  providers: [ManualRequestsService],
  exports: [ManualRequestsService],
})
export class ManualRequestsModule {}
