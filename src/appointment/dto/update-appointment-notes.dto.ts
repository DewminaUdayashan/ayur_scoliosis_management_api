import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateAppointmentNotesDto {
  @ApiProperty({
    description: 'Notes for the appointment',
    example:
      'Patient reported improvement in posture. Recommended exercises provided.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Notes cannot exceed 2000 characters' })
  notes: string;
}
