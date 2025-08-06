import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePractitionerDto } from './dto/create-practitioner.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service'; // Import the EmailService
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { randomBytes, randomInt } from 'crypto';
import { AppUser } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async registerPractitioner(
    createPractitionerDto: CreatePractitionerDto,
    imageUrls: { profileImageUrl?: string; clinicImageUrl?: string },
  ) {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      specialty,
      medicalLicense,
      clinicName,
      clinicAddressLine1,
      clinicAddressLine2,
      clinicCity,
      clinicEmail,
      clinicPhone,
    } = createPractitionerDto;

    const existingUser = await this.prisma.appUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newClinic = await this.prisma.clinic.create({
      data: {
        name: clinicName,
        addressLine1: clinicAddressLine1,
        addressLine2: clinicAddressLine2,
        city: clinicCity,
        email: clinicEmail,
        phone: clinicPhone,
        imageUrl: imageUrls.clinicImageUrl,
      },
    });

    const newPractitioner = await this.prisma.appUser.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        role: 'Practitioner',
        profileImageUrl: imageUrls.profileImageUrl,
        practitioner: {
          create: {
            phone,
            specialty,
            medicalLicense,
            status: 'Pending',
            clinicId: newClinic.id,
          },
        },
      },
      include: {
        practitioner: {
          include: {
            clinic: true,
          },
        },
      },
    });

    // Send a welcome email to the new practitioner
    await this.emailService.sendWelcomeEmail(
      newPractitioner.email,
      newPractitioner.firstName,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = newPractitioner;
    return { code: 'REGISTRATION_SUCCESS', data: result };
  }

  async loginPractitioner(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.appUser.findUnique({
      where: { email },
      include: { practitioner: true },
    });

    if (!user || !user.practitioner) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatching = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.practitioner.status !== 'Active') {
      throw new UnauthorizedException(
        `Your account is currently ${user.practitioner.status}. Please contact an administrator.`,
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomBytes(16).toString('hex'), // Add jti here as well
    };

    return {
      code: 'LOGIN_SUCCESS',
      access_token: this.jwtService.sign(payload),
    };
  }

  async activatePractitioner(id: string) {
    const practitioner = await this.prisma.practitioner.findUnique({
      where: { appUserId: id },
    });

    if (!practitioner) {
      throw new NotFoundException('Practitioner not found');
    }

    return this.prisma.practitioner.update({
      where: { appUserId: id },
      data: { status: 'Active' },
    });
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; code: string }> {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.appUser.findUnique({ where: { email } });

    // To prevent user enumeration, always return a success message,
    // even if the user is not found.
    if (user) {
      // Generate a 6-digit OTP
      const otp = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

      // Invalidate any old tokens for this user
      await this.prisma.passwordReset.deleteMany({ where: { email } });

      // Store the new OTP in the database
      await this.prisma.passwordReset.create({
        data: {
          email,
          token: otp,
          expiresAt,
        },
      });

      // Send the OTP to the user's email
      await this.emailService.sendPasswordResetOtp(
        user.email,
        user.firstName,
        otp,
      );
    }

    return {
      code: 'PASSWORD_RESET_OTP_SENT',
      message:
        'If a user with that email exists, a password reset OTP has been sent.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string; code: string }> {
    const { email, token, password } = resetPasswordDto;

    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    // Check for a valid token and ensure it belongs to the correct user
    if (!passwordReset || passwordReset.email !== email) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    // Check if the token has expired
    if (new Date() > passwordReset.expiresAt) {
      // Clean up the expired token
      await this.prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      });
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await this.prisma.appUser.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    // Delete the used token from the database
    await this.prisma.passwordReset.delete({ where: { id: passwordReset.id } });

    return {
      code: 'PASSWORD_RESET_SUCCESS',
      message: 'Your password has been successfully reset.',
    };
  }

  async setInitialPassword(
    userId: string,
    newPassword: string,
  ): Promise<{ message: string; code: string }> {
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mustChangePassword) {
      throw new BadRequestException(
        'Invalid request. User may have already set their password.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.appUser.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false, // Flip the flag after setting the new password
      },
    });

    return {
      code: 'INITIAL_PASSWORD_SET',
      message: 'Password has been set successfully. Please log in again.',
    };
  }

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;
    const user = await this.prisma.appUser.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordMatching = await bcrypt.compare(
      password,
      user.passwordHash,
    );
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.mustChangePassword) {
      const tempPayload = { sub: user.id, mustChangePassword: true };
      return {
        message: 'Password change required.',
        code: 'PASSWORD_CHANGE_REQUIRED',
        temp_access_token: this.jwtService.sign(tempPayload, {
          expiresIn: '15m',
        }),
      };
    }

    if (user.role === 'Practitioner') {
      const practitioner = await this.prisma.practitioner.findUnique({
        where: { appUserId: user.id },
      });
      if (practitioner?.status !== 'Active') {
        throw new UnauthorizedException(
          `Your account is currently ${practitioner?.status}. Please contact an administrator.`,
        );
      }
    }

    // Add the unique JWT ID (jti) to the payload. This is the fix.
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti: randomBytes(16).toString('hex'),
    };

    return {
      code: 'LOGIN_SUCCESS',
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Adds a token's JTI to the revoked list to invalidate it.
   * @param user The authenticated user object from the JWT payload.
   */
  async signOut(
    user: Omit<AppUser, 'passwordHash'> & { jti: string; exp: number },
  ): Promise<{ message: string; code: string }> {
    const { jti, exp } = user;

    // The expiration date is in seconds, so we multiply by 1000 for milliseconds
    const expiresAt = new Date(exp * 1000);

    await this.prisma.revokedToken.create({
      data: {
        jti,
        expiresAt,
      },
    });

    return {
      code: 'LOGOUT_SUCCESS',
      message: 'You have been successfully signed out.',
    };
  }
}
