import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoCallStatus } from '@prisma/client';

@Injectable()
export class VideoCallService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoomForAppointment(appointmentId: string): Promise<string> {
    // Check if room already exists
    const existingRoom = await this.prisma.videoCallRoom.findUnique({
      where: { appointmentId },
    });

    if (existingRoom) {
      return existingRoom.roomId;
    }

    // Create new room
    const room = await this.prisma.videoCallRoom.create({
      data: {
        appointmentId,
        roomId: this.generateRoomId(),
        status: VideoCallStatus.Waiting,
      },
    });

    return room.roomId;
  }

  async canUserJoinRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await this.prisma.videoCallRoom.findUnique({
      where: { roomId },
      include: {
        appointment: {
          include: {
            patient: true,
            practitioner: true,
          },
        },
      },
    });

    if (!room) {
      return false;
    }

    // Check if user is either the patient or practitioner for this appointment
    const isPractitioner = room.appointment.practitioner.id === userId;
    const isPatient = room.appointment.patient.id === userId;

    return isPractitioner || isPatient;
  }

  async userJoinedRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.prisma.videoCallRoom.findUnique({
      where: { roomId },
      include: {
        appointment: {
          include: {
            patient: true,
            practitioner: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const isPractitioner = room.appointment.practitioner.id === userId;
    const isPatient = room.appointment.patient.id === userId;

    const updateData: {
      updatedAt: Date;
      practitionerJoined?: boolean;
      patientJoined?: boolean;
      status?: VideoCallStatus;
      startedAt?: Date;
    } = {
      updatedAt: new Date(),
    };

    if (isPractitioner) {
      updateData.practitionerJoined = true;
    } else if (isPatient) {
      updateData.patientJoined = true;
    }

    // If both have joined and status is still Waiting, change to InProgress
    if (
      (room.practitionerJoined || isPractitioner) &&
      (room.patientJoined || isPatient) &&
      room.status === VideoCallStatus.Waiting
    ) {
      updateData.status = VideoCallStatus.InProgress;
      updateData.startedAt = new Date();
    }

    await this.prisma.videoCallRoom.update({
      where: { roomId },
      data: updateData,
    });
  }

  async userLeftRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.prisma.videoCallRoom.findUnique({
      where: { roomId },
      include: {
        appointment: {
          include: {
            patient: true,
            practitioner: true,
          },
        },
      },
    });

    if (!room) {
      return;
    }

    const isPractitioner = room.appointment.practitioner.id === userId;
    const isPatient = room.appointment.patient.id === userId;

    const updateData: {
      updatedAt: Date;
      practitionerJoined?: boolean;
      patientJoined?: boolean;
    } = {
      updatedAt: new Date(),
    };

    if (isPractitioner) {
      updateData.practitionerJoined = false;
    } else if (isPatient) {
      updateData.patientJoined = false;
    }

    await this.prisma.videoCallRoom.update({
      where: { roomId },
      data: updateData,
    });
  }

  async endCall(roomId: string): Promise<void> {
    await this.prisma.videoCallRoom.update({
      where: { roomId },
      data: {
        status: VideoCallStatus.Ended,
        endedAt: new Date(),
        practitionerJoined: false,
        patientJoined: false,
      },
    });
  }

  async getRoomByAppointmentId(appointmentId: string, userId: string) {
    const room = await this.prisma.videoCallRoom.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            patient: true,
            practitioner: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found for this appointment');
    }

    // Check if user is authorized to access this room
    const isPractitioner = room.appointment.practitioner.id === userId;
    const isPatient = room.appointment.patient.id === userId;

    if (!isPractitioner && !isPatient) {
      throw new ForbiddenException('Not authorized to access this room');
    }

    return {
      id: room.id,
      roomId: room.roomId,
      appointmentId: room.appointmentId,
      status: room.status,
      practitionerJoined: room.practitionerJoined,
      patientJoined: room.patientJoined,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      appointment: {
        id: room.appointment.id,
        scheduledDate: room.appointment.appointmentDateTime,
        patient: {
          id: room.appointment.patient.id,
          firstName: room.appointment.patient.firstName,
          lastName: room.appointment.patient.lastName,
        },
        practitioner: {
          id: room.appointment.practitioner.id,
          firstName: room.appointment.practitioner.firstName,
          lastName: room.appointment.practitioner.lastName,
        },
      },
    };
  }

  private generateRoomId(): string {
    // Generate a unique room ID
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
