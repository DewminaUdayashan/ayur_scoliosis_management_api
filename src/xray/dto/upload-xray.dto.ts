import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadXrayDto {
  @ApiPropertyOptional({ description: 'Optional notes for the X-ray image.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
