import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Get,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreatePractitionerDto } from './dto/create-practitioner.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/user.decorator';
import { UserRole, AppUser } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication') // This groups all endpoints under the 'Authentication' tag in Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/practitioner')
  @ApiBody({ type: CreatePractitionerDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The practitioner has been successfully created.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A user with this email already exists.',
  })
  registerPractitioner(@Body() createPractitionerDto: CreatePractitionerDto) {
    return this.authService.registerPractitioner(createPractitionerDto);
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
  @ApiBearerAuth() // Indicates that this endpoint requires a Bearer token
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
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
  @ApiBearerAuth() // Indicates that this endpoint requires a Bearer token
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
