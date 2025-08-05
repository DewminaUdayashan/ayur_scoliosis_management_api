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
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            // Use crypto.randomBytes for a cryptographically secure random filename
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

    // The controller now passes the flattened DTO directly to the service.
    // The service will be responsible for handling the flattened data.
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
}
