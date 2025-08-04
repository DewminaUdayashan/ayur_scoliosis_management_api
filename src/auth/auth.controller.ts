import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreatePractitionerDto } from './dto/create-practitioner.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/user.decorator';
import { UserRole, AppUser } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/practitioner')
  registerPractitioner(@Body() createPractitionerDto: CreatePractitionerDto) {
    return this.authService.registerPractitioner(createPractitionerDto);
  }

  @Post('login/practitioner')
  loginPractitioner(@Body() loginDto: LoginDto) {
    return this.authService.loginPractitioner(loginDto);
  }

  @Patch('practitioner/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  activatePractitioner(@Param('id') id: string) {
    return this.authService.activatePractitioner(id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user: Omit<AppUser, 'passwordHash'>) {
    // By using the @GetUser() decorator, we get a strongly-typed user object
    // directly as a parameter, which resolves the 'unsafe return' error.
    return user;
  }
}
