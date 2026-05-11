import { IsString, IsOptional, IsDateString, MaxLength, MinLength } from 'class-validator';

export class CreateManualRequestDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
