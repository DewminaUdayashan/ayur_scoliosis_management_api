import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Get,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { CreatePractitionerDto } from './dto/create-practitioner.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/user.decorator';
import { AppUser } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs'; // Import fs functions to check and create directories
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/practitioner')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profileImage', maxCount: 1 },
        { name: 'clinicImage', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 8 * 1024 * 1024, // 8 MB
        },
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = './uploads';
            // Check if the upload path exists, and create it if it does not
            if (!existsSync(uploadPath)) {
              mkdirSync(uploadPath);
            }
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            const randomName = randomBytes(16).toString('hex');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  @ApiBody({
    description:
      'Practitioner and Clinic registration data. All fields except for the images are required.',
    type: CreatePractitionerDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The practitioner has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A user with this email already exists.',
  })
  registerPractitioner(
    @UploadedFiles()
    files: {
      profileImage?: Express.Multer.File[];
      clinicImage?: Express.Multer.File[];
    },
    @Body() body: CreatePractitionerDto,
  ) {
    const profileImageUrl = files.profileImage
      ? `/uploads/${files.profileImage[0].filename}`
      : undefined;
    const clinicImageUrl = files.clinicImage
      ? `/uploads/${files.clinicImage[0].filename}`
      : undefined;

    return this.authService.registerPractitioner(body, {
      profileImageUrl,
      clinicImageUrl,
    });
  }

  @Post('login/practitioner')
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful, returns a JWT access token.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account is not active.',
  })
  loginPractitioner(@Body() loginDto: LoginDto) {
    return this.authService.loginPractitioner(loginDto);
  }

  @Patch('practitioner/:id/activate')
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Practitioner account has been successfully activated.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authorized to perform this action.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Practitioner not found.',
  })
  activatePractitioner(@Param('id') id: string) {
    return this.authService.activatePractitioner(id);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the authenticated user profile.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated.',
  })
  getProfile(@GetUser() user: Omit<AppUser, 'passwordHash'>) {
    return user;
  }

  @Post('forgot-password')
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'If a user with that email exists, a password reset OTP has been sent.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password has been successfully reset.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired password reset token.',
  })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
