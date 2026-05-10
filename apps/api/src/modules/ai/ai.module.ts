import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { OllamaProvider } from './ollama.provider';
import { MockAiProvider } from './mock-ai.provider';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [AiController],
  providers: [AiService, OllamaProvider, MockAiProvider],
})
export class AiModule {}
