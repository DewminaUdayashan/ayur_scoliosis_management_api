import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class GetPatientsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search for patients by name or email.',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
