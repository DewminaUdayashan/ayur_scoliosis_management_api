import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class GetPatientEventsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'The ID of the patient to get events for (Admin only).',
  })
  @IsOptional()
  @IsString()
  patientId?: string;
}
