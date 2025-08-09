import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AppointmentType } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'The ID of the patient for the appointment.' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({
    description: 'The date and time of the appointment in ISO 8601 format.',
  })
  @IsDateString()
  @IsNotEmpty()
  appointmentDateTime: string;

  @ApiProperty({
    description: 'The duration of the appointment in minutes.',
    default: 30,
  })
  @IsInt()
  @Min(1)
  durationInMinutes: number;

  @ApiProperty({
    enum: AppointmentType,
    description: 'The type of the appointment.',
  })
  @IsEnum(AppointmentType)
  type: AppointmentType;

  @ApiPropertyOptional({ description: 'Optional notes for the appointment.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
