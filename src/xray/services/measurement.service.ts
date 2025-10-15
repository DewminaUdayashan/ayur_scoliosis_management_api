import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from '../dto/measurement.dto';
import { AppUser, UserRole } from '@prisma/client';

@Injectable()
export class MeasurementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create measurements for an X-ray image
   */
  async createMeasurements(
    createMeasurementDto: CreateMeasurementDto,
    practitionerId: string,
  ) {
    const { xrayImageId, measurements } = createMeasurementDto;

    // Verify the X-ray image exists
    const xrayImage = await this.prisma.xRayImage.findUnique({
      where: { id: xrayImageId },
      include: {
        patientEvent: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!xrayImage) {
      throw new NotFoundException('X-ray image not found.');
    }

    // Delete existing measurements and create new ones in a transaction
    const createdMeasurements = await this.prisma.$transaction(async (tx) => {
      // First, delete all existing measurements for this X-ray
      await tx.xRayMeasurement.deleteMany({
        where: {
          xrayImageId,
        },
      });

      // Then create the new measurements
      const newMeasurements = await Promise.all(
        measurements.map((measurement) =>
          tx.xRayMeasurement.create({
            data: {
              xrayImageId,
              line1StartX: measurement.line1Start.x,
              line1StartY: measurement.line1Start.y,
              line1EndX: measurement.line1End.x,
              line1EndY: measurement.line1End.y,
              line2StartX: measurement.line2Start.x,
              line2StartY: measurement.line2Start.y,
              line2EndX: measurement.line2End.x,
              line2EndY: measurement.line2End.y,
              cobbAngle: measurement.cobbAngle,
              createdById: practitionerId,
              notes: measurement.notes,
            },
          }),
        ),
      );

      return newMeasurements;
    });

    return {
      code: 'MEASUREMENTS_SAVED',
      message:
        'Measurements saved successfully. Previous measurements have been replaced.',
      data: createdMeasurements,
    };
  }

  /**
   * Get all measurements for an X-ray image
   */
  async getMeasurementsByXrayId(
    xrayImageId: string,
    user: Omit<AppUser, 'passwordHash'>,
  ) {
    // Verify the X-ray image exists and user has access
    const xrayImage = await this.prisma.xRayImage.findUnique({
      where: { id: xrayImageId },
      include: {
        patientEvent: {
          include: {
            patient: true,
          },
        },
        measurements: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!xrayImage) {
      throw new NotFoundException('X-ray image not found.');
    }

    // Check access permissions
    const isOwnXray = xrayImage.patientEvent.patientId === user.id;
    const isPractitioner = user.role === UserRole.Practitioner;
    const isAdmin = user.role === UserRole.Admin;

    if (!isOwnXray && !isPractitioner && !isAdmin) {
      throw new ForbiddenException('You do not have access to this X-ray.');
    }

    // Transform measurements to match frontend structure
    const transformedMeasurements = xrayImage.measurements.map(
      (measurement) => ({
        id: measurement.id,
        line1Start: {
          x: Number(measurement.line1StartX),
          y: Number(measurement.line1StartY),
        },
        line1End: {
          x: Number(measurement.line1EndX),
          y: Number(measurement.line1EndY),
        },
        line2Start: {
          x: Number(measurement.line2StartX),
          y: Number(measurement.line2StartY),
        },
        line2End: {
          x: Number(measurement.line2EndX),
          y: Number(measurement.line2EndY),
        },
        cobbAngle: Number(measurement.cobbAngle),
        notes: measurement.notes,
        createdBy: measurement.createdBy,
        createdAt: measurement.createdAt,
        updatedAt: measurement.updatedAt,
      }),
    );

    return {
      code: 'MEASUREMENTS_RETRIEVED',
      data: {
        xrayImageId,
        measurements: transformedMeasurements,
      },
    };
  }

  /**
   * Update a specific measurement
   */
  async updateMeasurement(
    measurementId: string,
    updateMeasurementDto: UpdateMeasurementDto,
    practitionerId: string,
  ) {
    const { measurement } = updateMeasurementDto;

    // Verify the measurement exists and user has permission to update
    const existingMeasurement = await this.prisma.xRayMeasurement.findUnique({
      where: { id: measurementId },
      include: {
        createdBy: true,
      },
    });

    if (!existingMeasurement) {
      throw new NotFoundException('Measurement not found.');
    }

    if (existingMeasurement.createdById !== practitionerId) {
      throw new ForbiddenException(
        'You can only update measurements you created.',
      );
    }

    const updatedMeasurement = await this.prisma.xRayMeasurement.update({
      where: { id: measurementId },
      data: {
        line1StartX: measurement.line1Start.x,
        line1StartY: measurement.line1Start.y,
        line1EndX: measurement.line1End.x,
        line1EndY: measurement.line1End.y,
        line2StartX: measurement.line2Start.x,
        line2StartY: measurement.line2Start.y,
        line2EndX: measurement.line2End.x,
        line2EndY: measurement.line2End.y,
        cobbAngle: measurement.cobbAngle,
        notes: measurement.notes,
      },
    });

    return {
      code: 'MEASUREMENT_UPDATED',
      message: 'Measurement updated successfully.',
      data: updatedMeasurement,
    };
  }

  /**
   * Delete a specific measurement
   */
  async deleteMeasurement(measurementId: string, practitionerId: string) {
    // Verify the measurement exists and user has permission to delete
    const existingMeasurement = await this.prisma.xRayMeasurement.findUnique({
      where: { id: measurementId },
    });

    if (!existingMeasurement) {
      throw new NotFoundException('Measurement not found.');
    }

    if (existingMeasurement.createdById !== practitionerId) {
      throw new ForbiddenException(
        'You can only delete measurements you created.',
      );
    }

    await this.prisma.xRayMeasurement.delete({
      where: { id: measurementId },
    });

    return {
      code: 'MEASUREMENT_DELETED',
      message: 'Measurement deleted successfully.',
    };
  }
}
