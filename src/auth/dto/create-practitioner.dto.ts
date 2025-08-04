import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreatePractitionerDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  specialty: string;

  @IsString()
  @IsNotEmpty()
  medicalLicense: string;

  @IsString()
  @IsNotEmpty()
  clinicId: string;
}
