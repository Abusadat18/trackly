import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class ManualEntryDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
