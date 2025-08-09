// src/appointment/appointment.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

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
   * It fetches potential conflicts from the DB and then checks for precise overlaps in memory.
   */
  private async isTimeSlotTaken(
    practitionerId: string,
    startTime: Date,
    duration: number,
  ): Promise<boolean> {
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Fetch appointments that are in a window around the proposed time to minimize the data retrieved.
    const potentialConflicts = await this.prisma.appointment.findMany({
      where: {
        practitionerId,
        status: { not: AppointmentStatus.Cancelled },
        // Find appointments that start before the proposed new one would end.
        appointmentDateTime: {
          lt: endTime,
        },
      },
    });

    // Now, check for a precise overlap in the application logic.
    for (const appointment of potentialConflicts) {
      const existingStartTime = appointment.appointmentDateTime.getTime();
      const existingEndTime =
        existingStartTime + appointment.durationInMinutes * 60000;

      // The overlap condition: (StartA < EndB) and (EndA > StartB)
      if (
        startTime.getTime() < existingEndTime &&
        endTime.getTime() > existingStartTime
      ) {
        return true; // A conflict was found
      }
    }

    return false; // No conflicts found
  }
}
