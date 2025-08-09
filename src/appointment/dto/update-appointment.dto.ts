import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({
    description: 'The new date and time for the appointment.',
  })
  @IsOptional()
  @IsDateString()
  appointmentDateTime?: string;

  @ApiPropertyOptional({
    description: 'The new duration for the appointment in minutes.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationInMinutes?: number;

  @ApiPropertyOptional({
    enum: AppointmentType,
    description: 'The new type for the appointment.',
  })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ description: 'Updated notes for the appointment.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
