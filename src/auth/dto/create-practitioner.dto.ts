import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
} from 'class-validator';

/**
 * DTO for practitioner registration with a flattened structure for clinic data.
 * This structure is optimized for multipart/form-data and provides a better
 * experience in Swagger UI by showing each field individually.
 */
export class CreatePractitionerDto {
  // --- Practitioner Fields ---
  @ApiProperty({ example: 'practitioner@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '123-456-7890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Scoliosis Specialist' })
  @IsString()
  @IsNotEmpty()
  specialty: string;

  @ApiProperty({ example: 'MD12345' })
  @IsString()
  @IsNotEmpty()
  medicalLicense: string;

  // --- Clinic Fields (Flattened) ---
  @ApiProperty({
    description: 'Name of the clinic',
    example: 'Ayurveda Wellness Center',
  })
  @IsString()
  @IsNotEmpty()
  clinicName: string;

  @ApiProperty({
    description: 'Address line 1 of the clinic',
    example: '123 Wellness Way',
  })
  @IsString()
  @IsNotEmpty()
  clinicAddressLine1: string;

  @ApiProperty({
    description: 'Address line 2 of the clinic',
    required: false,
    example: 'Suite 100',
  })
  @IsOptional()
  @IsString()
  clinicAddressLine2?: string;

  @ApiProperty({ description: 'City of the clinic', example: 'Healthville' })
  @IsString()
  @IsNotEmpty()
  clinicCity: string;

  @ApiProperty({
    description: 'Email of the clinic',
    example: 'contact@ayurvedawellness.com',
  })
  @IsEmail()
  @IsNotEmpty()
  clinicEmail: string;

  @ApiProperty({
    description: 'Phone number of the clinic',
    example: '987-654-3210',
  })
  @IsString()
  @IsNotEmpty()
  clinicPhone: string;

  // --- File Upload Fields ---
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Optional profile image for the practitioner.',
  })
  profileImage?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Optional image for the clinic.',
  })
  clinicImage?: Express.Multer.File;
}
