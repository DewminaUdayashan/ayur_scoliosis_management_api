import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'The date and time to check in ISO 8601 format.',
  })
  @IsDateString()
  @IsNotEmpty()
  dateTime: string;

  @ApiProperty({
    description: 'The duration to check in minutes.',
    default: 30,
  })
  @IsInt()
  @Min(1)
  durationInMinutes: number;
}
