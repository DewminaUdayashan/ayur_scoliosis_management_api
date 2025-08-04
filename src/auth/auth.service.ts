import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreatePractitionerDto } from './dto/create-practitioner.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerPractitioner(createPractitionerDto: CreatePractitionerDto) {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      specialty,
      medicalLicense,
      clinic,
    } = createPractitionerDto;

    const existingUser = await this.prisma.appUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the clinic first
    const newClinic = await this.prisma.clinic.create({
      data: clinic,
    });

    // Now create the AppUser and the nested Practitioner, using the new clinic's ID
    const newPractitioner = await this.prisma.appUser.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        role: 'Practitioner',
        practitioner: {
          create: {
            phone,
            specialty,
            medicalLicense,
            status: 'Pending',
            clinicId: newClinic.id, // Use the ID from the newly created clinic
          },
        },
      },
      include: {
        practitioner: {
          include: {
            clinic: true, // Include the clinic details in the response
          },
        },
      },
    });

    // Exclude password from the returned object
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
