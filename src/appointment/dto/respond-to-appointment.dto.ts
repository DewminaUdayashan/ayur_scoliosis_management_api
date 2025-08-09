import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RespondToAppointmentDto {
  @ApiProperty({
    description: 'Whether the patient accepts the appointment.',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  accepted: boolean;

  @ApiPropertyOptional({
    description:
      'An optional message from the patient, typically used when declining to suggest a new time.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}
