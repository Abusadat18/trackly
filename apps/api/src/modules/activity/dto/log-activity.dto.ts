import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityCategory } from '@prisma/client';

export class ActivityItemDto {
  @IsString()
  appName: string;

  @IsOptional()
  @IsString()
  windowTitle?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsEnum(ActivityCategory)
  category?: ActivityCategory;

  @IsInt()
  @Min(1)
  durationSecs: number;

  @IsDateString()
  recordedAt: string;

  @IsOptional()
  @IsString()
  timeEntryId?: string;
}

export class LogActivityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityItemDto)
  activities: ActivityItemDto[];
}
