import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer'; // 1. Import the Type decorator

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
  @Type(() => Number) // All query params are treated as strings. So, we need to transform it to a number.
  @IsInt()
  @Min(1)
  durationInMinutes: number;
}
