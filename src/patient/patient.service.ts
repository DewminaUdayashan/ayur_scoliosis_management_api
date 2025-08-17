import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { InvitePatientDto } from './dto/invite-patient.dto';
import { customAlphabet } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AppUser, UserRole } from '@prisma/client';

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

  /**
   * Retrieves a paginated list of patients invited by a specific practitioner.
   * @param practitionerId The ID of the authenticated practitioner.
   * @param paginationDto DTO containing page and pageSize for pagination.
   */
  async getPatientsForPractitioner(
    practitionerId: string,
    paginationDto: PaginationDto,
  ) {
    // Ensure default values are used if page or pageSize are not provided.
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const [patients, totalCount] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where: {
          practitionerId: practitionerId,
        },
        include: {
          appUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImageUrl: true,
            },
          },
        },
        skip,
        take: pageSize,
      }),
      this.prisma.patient.count({
        where: {
          practitionerId: practitionerId,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: patients,
      meta: {
        totalCount,
        currentPage: page,
        pageSize,
        totalPages,
      },
    };
  }

  /**
   * Retrieves the full details for a single patient by their ID.
   * Enforces authorization rules based on the requester's role.
   * @param user The authenticated user making the request.
   * @param patientId The ID of the patient to retrieve.
   */
  async getPatientDetails(
    user: Omit<AppUser, 'passwordHash'>,
    patientId: string,
  ) {
    const patient = await this.prisma.appUser.findUnique({
      where: { id: patientId },
      include: {
        practitioner: {
          include: {
            clinic: true, // Also include clinic details for practitioners
          },
        },
        patient: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found.');
    }

    // Authorization Logic
    if (user.role === UserRole.Patient) {
      // Patients can only access their own details.
      if (patient.id !== user.id) {
        throw new ForbiddenException(
          "You do not have permission to view this patient's details.",
        );
      }
    } else if (user.role === UserRole.Practitioner) {
      // Practitioners can only access patients they have invited.
      if (patient.practitioner?.appUserId !== user.id) {
        throw new ForbiddenException(
          "You do not have permission to view this patient's details.",
        );
      }
    }
    // Admins are implicitly allowed to proceed.

    return patient;
  }
}
