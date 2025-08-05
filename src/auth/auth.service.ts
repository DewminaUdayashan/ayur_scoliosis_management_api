import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePractitionerDto } from './dto/create-practitioner.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service'; // Import the EmailService

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
    return result;
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

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
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
}
