// src/profile/dto/update-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  // A custom transformer to convert empty strings to undefined.
  // This allows the @IsOptional decorator to work correctly with multipart/form-data.
  private static transformEmptyStringToUndefined = ({
    value,
  }: {
    value: any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  }) => (value === '' ? undefined : value);

  // --- Common AppUser Fields ---
  @ApiProperty({ description: "User's first name.", required: false })
  @IsOptional()
  @IsString()
  @Transform(UpdateProfileDto.transformEmptyStringToUndefined)
  firstName?: string;

  @ApiProperty({ description: "User's last name.", required: false })
  @IsOptional()
  @IsString()
  @Transform(UpdateProfileDto.transformEmptyStringToUndefined)
  lastName?: string;

  // --- Practitioner-Specific Fields ---
  @ApiProperty({ description: "Practitioner's phone number.", required: false })
  @IsOptional()
  @IsString()
  @Transform(UpdateProfileDto.transformEmptyStringToUndefined)
  phone?: string;

  @ApiProperty({ description: "Practitioner's specialty.", required: false })
  @IsOptional()
  @IsString()
  @Transform(UpdateProfileDto.transformEmptyStringToUndefined)
  specialty?: string;

  // --- Patient-Specific Fields ---
  @ApiProperty({ description: "Patient's date of birth.", required: false })
  @IsOptional()
  @IsDateString()
  @Transform(UpdateProfileDto.transformEmptyStringToUndefined)
  dateOfBirth?: string;

  @ApiProperty({ description: "Patient's gender.", required: false })
  @IsOptional()
  @IsString()
  @Transform(UpdateProfileDto.transformEmptyStringToUndefined)
  gender?: string;

  // --- File Upload Field ---
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Optional new profile image.',
  })
  @IsOptional() // Make sure the file itself is optional
  profileImage?: any;
}
