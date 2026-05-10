import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['ADMIN', 'MEMBER'], example: 'MEMBER' })
  @IsEnum(['ADMIN', 'MEMBER'] as const)
  role: 'ADMIN' | 'MEMBER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamId?: string;
}

export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  token: string;
}
