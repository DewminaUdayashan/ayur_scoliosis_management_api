import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class GetXraysDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'The ID of the patient to get X-rays for (Admin only).',
  })
  @IsOptional()
  @IsString()
  patientId?: string;
}
