import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  ValidateNested,
  IsOptional,
} from 'class-validator';

/**
 * DTO for the nested clinic object.
 * This defines the shape of the clinic data required during practitioner registration.
 */
export class ClinicDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiProperty()
  @IsString()
  addressLine2?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

/**
 * Main DTO for practitioner registration.
 * Includes the practitioner's details and the nested clinic information.
 */
export class CreatePractitionerDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicalLicense: string;

  @ApiProperty()
  // This tells class-validator to validate the nested clinic object
  @ValidateNested()
  // This helps class-transformer to correctly instantiate the nested DTO
  @Type(() => ClinicDto)
  @IsNotEmpty()
  clinic: ClinicDto;
}
