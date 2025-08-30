import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppUser, Prisma, UserRole } from '@prisma/client';
import { GetPatientEventsDto } from './dto/get-patient-events.dto';

@Injectable()
export class PatientEventService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves a paginated list of patient events.
   * - Patients can only see their own events.
   * - Practitioners can see events for any of their patients.
   * - Admins can see events for any patient by providing a patientId.
   * @param user The authenticated user.
   * @param query DTO for pagination and filtering.
   */
  async getPatientEvents(
    user: Omit<AppUser, 'passwordHash'>,
    query: GetPatientEventsDto,
  ) {
    const { page = 1, pageSize = 10, patientId } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PatientEventWhereInput = {};

    if (user.role === UserRole.Patient) {
      where.patientId = user.id;
    } else if (user.role === UserRole.Practitioner) {
      const patientsOfPractitioner = await this.prisma.patient.findMany({
        where: { practitionerId: user.id },
        select: { appUserId: true },
      });
      const patientIds = patientsOfPractitioner.map((p) => p.appUserId);
      where.patientId = { in: patientIds };
    } else if (user.role === UserRole.Admin) {
      if (!patientId) {
        throw new BadRequestException('patientId is required for Admin role.');
      }
      where.patientId = patientId;
    } else {
      throw new ForbiddenException(
        'You do not have permission to view patient events.',
      );
    }

    const [events, totalCount] = await this.prisma.$transaction([
      this.prisma.patientEvent.findMany({
        where,
        include: {
          xrayImages: true,
          aiClassificationResult: true,
          scoliosisMeasurement: true,
          sessionNote: true,
          createdByPractitioner: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          eventDateTime: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.patientEvent.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: events,
      meta: {
        totalCount,
        currentPage: page,
        pageSize,
        totalPages,
      },
    };
  }
}
