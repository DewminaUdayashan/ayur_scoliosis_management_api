// src/appointment/appointment.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { AppointmentStatus, AppUser, Prisma, UserRole } from '@prisma/client';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { EmailService } from 'src/email/email.service';
import { GetAppointmentsDto } from './dto/get-appointments.dto';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Retrieves a paginated, filtered, and sorted list of appointments based on the user's role.
   */
  async getAppointments(
    user: Omit<AppUser, 'passwordHash'>,
    query: GetAppointmentsDto,
  ) {
    const {
      page = 1,
      pageSize = 10,
      patientId,
      sortBy = 'appointmentDateTime',
      sortOrder = 'asc',
    } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AppointmentWhereInput = {};

    if (user.role === UserRole.Practitioner) {
      where.practitionerId = user.id;
      if (patientId) {
        where.patientId = patientId;
      }
    } else if (user.role === UserRole.Patient) {
      where.patientId = user.id;
    }

    const [appointments, totalCount] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        include: {
          // Include the first and last name from the related AppUser for the patient
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          // Correctly include the first and last name from the related AppUser for the practitioner
          practitioner: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        skip,
        take: pageSize,
        // Use the validated sortBy and sortOrder for dynamic sorting
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: appointments,
      meta: {
        totalCount,
        currentPage: page,
        pageSize,
        totalPages,
      },
    };
  }

  /**
   * Checks if a given time slot is available for a practitioner.
   */
  async checkAvailability(
    practitionerId: string,
    checkAvailabilityDto: CheckAvailabilityDto,
  ) {
    const isSlotTaken = await this.isTimeSlotTaken(
      practitionerId,
      new Date(checkAvailabilityDto.dateTime),
      checkAvailabilityDto.durationInMinutes,
    );

    return { isAvailable: !isSlotTaken };
  }

  /**
   * Creates a new appointment if the time slot is available.
   */
  async createAppointment(
    practitionerId: string,
    createAppointmentDto: CreateAppointmentDto,
  ) {
    const { patientId, appointmentDateTime, durationInMinutes, type, notes } =
      createAppointmentDto;

    // Verify that the patient exists and belongs to the practitioner
    const patient = await this.prisma.patient.findFirst({
      where: { appUserId: patientId, practitionerId: practitionerId },
    });

    if (!patient) {
      throw new NotFoundException(
        'Patient not found or does not belong to this practitioner.',
      );
    }

    const proposedStartTime = new Date(appointmentDateTime);

    // Check for scheduling conflicts
    const isSlotTaken = await this.isTimeSlotTaken(
      practitionerId,
      proposedStartTime,
      durationInMinutes,
    );
    if (isSlotTaken) {
      throw new ConflictException(
        'This time slot is already booked. Please choose another time.',
      );
    }

    // Create the appointment
    const newAppointment = await this.prisma.appointment.create({
      data: {
        practitionerId,
        patientId,
        appointmentDateTime: proposedStartTime,
        durationInMinutes,
        type,
        notes,
        status: AppointmentStatus.PendingPatientConfirmation, // Set initial status
      },
    });

    return newAppointment;
  }

  /**
   * A helper method to determine if a time slot is already occupied.
   * It fetches potential conflicts from the DB and then checks for precise overlaps in memory,
   * excluding the current appointment being updated.
   */
  private async isTimeSlotTaken(
    practitionerId: string,
    startTime: Date,
    duration: number,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const potentialConflicts = await this.prisma.appointment.findMany({
      where: {
        id: { not: excludeAppointmentId }, // Exclude the current appointment from the check
        practitionerId,
        status: { not: AppointmentStatus.Cancelled },
        appointmentDateTime: {
          lt: endTime,
        },
      },
    });

    for (const appointment of potentialConflicts) {
      const existingStartTime = appointment.appointmentDateTime.getTime();
      const existingEndTime =
        existingStartTime + appointment.durationInMinutes * 60000;

      if (
        startTime.getTime() < existingEndTime &&
        endTime.getTime() > existingStartTime
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Updates an existing appointment.
   */
  async updateAppointment(
    practitionerId: string,
    appointmentId: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.practitionerId !== practitionerId) {
      throw new NotFoundException(
        'Appointment not found or you do not have permission to edit it.',
      );
    }

    if (
      appointment.status === 'Completed' ||
      appointment.status === 'Cancelled'
    ) {
      throw new ForbiddenException(
        `Cannot update an appointment with '${appointment.status}' status.`,
      );
    }

    const newStartTime = updateAppointmentDto.appointmentDateTime
      ? new Date(updateAppointmentDto.appointmentDateTime)
      : appointment.appointmentDateTime;
    const newDuration =
      updateAppointmentDto.durationInMinutes ?? appointment.durationInMinutes;

    if (
      updateAppointmentDto.appointmentDateTime ||
      updateAppointmentDto.durationInMinutes
    ) {
      const isSlotTaken = await this.isTimeSlotTaken(
        practitionerId,
        newStartTime,
        newDuration,
        appointmentId,
      );
      if (isSlotTaken) {
        throw new ConflictException(
          'This time slot conflicts with another appointment.',
        );
      }
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...updateAppointmentDto,
        appointmentDateTime: newStartTime,
        status:
          appointment.status === 'Scheduled'
            ? 'PendingPatientConfirmation'
            : appointment.status,
      },
      // Correctly include the related AppUser data for the patient
      include: {
        patient: true,
      },
    });

    // Send an email notification to the patient about the update
    await this.emailService.sendAppointmentUpdateEmail(
      updatedAppointment.patient.email,
      updatedAppointment.patient.firstName,
      updatedAppointment,
    );
    return updatedAppointment;
  }
}
