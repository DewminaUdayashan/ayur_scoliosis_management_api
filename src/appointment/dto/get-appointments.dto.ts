import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SortOrder } from 'src/common/enum/enums';

export class GetAppointmentsDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      'Filter appointments by a specific patient ID (Practitioner only).',
    type: String,
  })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({
    description:
      "The field to sort by. Currently only 'appointmentDateTime' is supported.",
    default: 'appointmentDateTime',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'appointmentDateTime';

  @ApiPropertyOptional({
    description: "The order to sort by ('asc' or 'desc').",
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
