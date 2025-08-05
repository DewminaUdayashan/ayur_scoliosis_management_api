import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InvitePatientDto } from './dto/invite-patient.dto';
import { customAlphabet } from 'nanoid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async invitePatient(
    practitionerId: string,
    invitePatientDto: InvitePatientDto,
  ) {
    const { email, firstName, lastName, dateOfBirth, gender } =
      invitePatientDto;

    const existingUser = await this.prisma.appUser.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const practitioner = await this.prisma.practitioner.findUnique({
      where: { appUserId: practitionerId },
    });
    if (!practitioner) {
      throw new NotFoundException('Practitioner not found.');
    }

    // Generate a secure, URL-friendly temporary password
    const nanoid = customAlphabet(
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      10,
    );
    const tempPassword = nanoid();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.appUser.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash: hashedPassword,
        role: 'Patient',
        mustChangePassword: true, // Force password change on first login
        patient: {
          create: {
            dateOfBirth: new Date(dateOfBirth),
            gender,
            practitionerId: practitioner.appUserId, // Link to the inviting practitioner
          },
        },
      },
    });

    await this.emailService.sendPatientInvitationEmail(
      email,
      firstName,
      tempPassword,
    );

    return { message: 'Patient invitation sent successfully.' };
  }
}
