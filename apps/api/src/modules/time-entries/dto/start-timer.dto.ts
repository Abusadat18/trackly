import { IsString, IsOptional, MaxLength } from 'class-validator';

export class StartTimerDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
