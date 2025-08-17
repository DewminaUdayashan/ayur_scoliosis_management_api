import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class InvitePatientDto {
  @ApiProperty({ example: 'patient@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123-456-7890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ example: 'Female' })
  @IsString()
  @IsNotEmpty()
  gender: string;
}
