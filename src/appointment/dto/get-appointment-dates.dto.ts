import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class GetAppointmentDatesDto {
  @ApiProperty({
    description: 'The start date of the range in ISO 8601 format (YYYY-MM-DD).',
    example: '2025-08-01',
  })
  @IsDateString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({
    description: 'The end date of the range in ISO 8601 format (YYYY-MM-DD).',
    example: '2025-08-31',
  })
  @IsDateString()
  @IsNotEmpty()
  end: string;
}
