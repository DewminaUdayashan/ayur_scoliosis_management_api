import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadXrayDto } from './dto/upload-xray.dto';
import {
  AppUser,
  EventType,
  Prisma,
  UserRole,
  AIClassificationType,
} from '@prisma/client';
import { GetXraysDto } from './dto/get-xrays.dto';
import { ClassificationService } from './services/classification.service';

@Injectable()
export class XRayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly classificationService: ClassificationService,
  ) {}

  /**
   * Retrieves a paginated list of X-ray images based on user role.
   * - Patients see their own X-rays.
   * - Admins can see any patient's X-rays by providing a patientId.
   * @param user The authenticated user.
   * @param query DTO for pagination and filtering.
   */
  async getXRays(user: Omit<AppUser, 'passwordHash'>, query: GetXraysDto) {
    const { page = 1, pageSize = 10, patientId } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.XRayImageWhereInput = {};

    console.log('User Role:', user.role);

    if (user.role === UserRole.Patient) {
      where.patientEvent = { patientId: user.id };
    } else if (user.role === UserRole.Practitioner) {
      if (!patientId) {
        throw new BadRequestException(
          'patientId is required for Practitioner role.',
        );
      }
      where.patientEvent = { patientId: patientId };
    } else {
      // Fallback for any other roles that are not permitted.
      throw new ForbiddenException(
        'You do not have permission to view X-ray images.',
      );
    }

    const [xrays, totalCount] = await this.prisma.$transaction([
      this.prisma.xRayImage.findMany({
        where,
        include: {
          patientEvent: {
            select: {
              eventDateTime: true,
            },
          },
        },
        orderBy: {
          patientEvent: {
            eventDateTime: 'desc',
          },
        },
        skip,
        take: pageSize,
      }),
      this.prisma.xRayImage.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: xrays,
      meta: {
        totalCount,
        currentPage: page,
        pageSize,
        totalPages,
      },
    };
  }

  /**
   * Creates a patient event and saves the X-ray image details.
   * @param patientId The ID of the patient uploading the image.
   * @param file The uploaded image file from multer.
   * @param uploadXrayDto DTO containing optional notes.
   */
  async uploadXrayImage(
    patientId: string,
    file: Express.Multer.File,
    uploadXrayDto: UploadXrayDto,
  ) {
    if (!file) {
      throw new BadRequestException('An X-ray image file is required.');
    }

    // Find the patient's record to get their practitioner's ID
    const patient = await this.prisma.patient.findUnique({
      where: { appUserId: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found.');
    }

    const imageUrl = `/uploads/xrays/${file.filename}`;

    // Use a transaction to ensure both the event and the image are created
    const patientEvent = await this.prisma.patientEvent.create({
      data: {
        patientId,
        createdByPractitionerId: patient.practitionerId, // The event is created by the patient's practitioner
        eventType: EventType.XRayUpload,
        eventDateTime: new Date(),
        isSharedWithPatient: true, // The patient can see their own upload
        xrayImages: {
          create: {
            imageUrl: imageUrl,
            notes: uploadXrayDto.notes,
          },
        },
      },
      include: {
        xrayImages: true, // Include the created X-ray image in the response
      },
    });

    // Start background classification (fire and forget)
    this.classifyXrayInBackground(file.path, patientEvent.id, patientId).catch(
      (error) => {
        console.error('Background classification failed:', error);
      },
    );

    return {
      code: 'XRAY_UPLOAD_SUCCESS',
      message: 'X-ray uploaded successfully.',
      data: patientEvent,
    };
  }

  /**
   * Background process to classify the uploaded X-ray and create classification events
   */
  private async classifyXrayInBackground(
    imagePath: string,
    xrayEventId: string,
    patientId: string,
  ): Promise<void> {
    try {
      console.log(
        `Starting background classification for X-ray event: ${xrayEventId}`,
      );

      const classificationResult =
        await this.classificationService.classifyXray(imagePath);

      // Find the patient's record to get their practitioner's ID
      const patient = await this.prisma.patient.findUnique({
        where: { appUserId: patientId },
      });

      if (!patient) {
        throw new Error('Patient record not found during classification.');
      }

      // Map classification results to database enum
      const classificationType = this.mapClassificationToEnum(
        classificationResult.condition.predicted_class,
        classificationResult.curve?.predicted_class,
      );

      // Extract confidence score (remove % and convert to decimal)
      const confidenceScore =
        parseFloat(classificationResult.condition.confidence.replace('%', '')) /
        100;

      // Create a classification event with AIClassificationResult
      await this.prisma.patientEvent.create({
        data: {
          patientId,
          createdByPractitionerId: patient.practitionerId,
          eventType: EventType.AIClassification,
          eventDateTime: new Date(),
          isSharedWithPatient: true,
          aiClassificationResult: {
            create: {
              classificationResult: classificationType,
              confidenceScore: confidenceScore,
              notes: classificationResult.curve
                ? `Curve type: ${classificationResult.curve.predicted_class} (${classificationResult.curve.confidence} confidence)`
                : null,
            },
          },
        },
      });

      console.log(
        `Background classification completed for X-ray event: ${xrayEventId}`,
      );
    } catch (error) {
      console.error(
        `Background classification failed for X-ray event ${xrayEventId}:`,
        error,
      );
      // Don't throw here as this is a background process
    }
  }

  /**
   * Maps Flask API classification results to database enum values
   */
  private mapClassificationToEnum(
    condition: string,
    curveType?: string,
  ): AIClassificationType {
    if (condition === 'normal') {
      return AIClassificationType.NoScoliosisDetected;
    }

    if (condition === 'scoliosis') {
      if (curveType === 'C-Curve') {
        return AIClassificationType.ScoliosisCCurve;
      }
      if (curveType === 'S-Curve') {
        return AIClassificationType.ScoliosisSCurve;
      }
      // Default to C-curve if curve type is not determined
      return AIClassificationType.ScoliosisCCurve;
    }

    // Fallback
    return AIClassificationType.AnalysisFailed;
  }
}
