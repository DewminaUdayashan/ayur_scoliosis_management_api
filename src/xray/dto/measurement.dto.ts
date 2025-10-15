import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeasurementPointDto {
  @ApiProperty({ description: 'X coordinate of the point' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y coordinate of the point' })
  @IsNumber()
  y: number;
}

export class SingleMeasurementDto {
  @ApiProperty({ description: 'Start point of the first line' })
  @ValidateNested()
  @Type(() => MeasurementPointDto)
  line1Start: MeasurementPointDto;

  @ApiProperty({ description: 'End point of the first line' })
  @ValidateNested()
  @Type(() => MeasurementPointDto)
  line1End: MeasurementPointDto;

  @ApiProperty({ description: 'Start point of the second line' })
  @ValidateNested()
  @Type(() => MeasurementPointDto)
  line2Start: MeasurementPointDto;

  @ApiProperty({ description: 'End point of the second line' })
  @ValidateNested()
  @Type(() => MeasurementPointDto)
  line2End: MeasurementPointDto;

  @ApiProperty({ description: 'Calculated Cobb angle in degrees' })
  @IsNumber()
  cobbAngle: number;

  @ApiPropertyOptional({ description: 'Optional notes for this measurement' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMeasurementDto {
  @ApiProperty({ description: 'ID of the X-ray image to measure' })
  @IsUUID()
  xrayImageId: string;

  @ApiProperty({
    description: 'Array of measurements for this X-ray',
    type: [SingleMeasurementDto],
  })
  @ValidateNested({ each: true })
  @Type(() => SingleMeasurementDto)
  measurements: SingleMeasurementDto[];
}

export class UpdateMeasurementDto {
  @ApiProperty({ description: 'Updated measurement data' })
  @ValidateNested()
  @Type(() => SingleMeasurementDto)
  measurement: SingleMeasurementDto;
}
