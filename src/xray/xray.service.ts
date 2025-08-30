import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadXrayDto } from './dto/upload-xray.dto';
import { EventType } from '@prisma/client';

@Injectable()
export class XRayService {
  constructor(private readonly prisma: PrismaService) {}

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

    return {
      code: 'XRAY_UPLOAD_SUCCESS',
      message: 'X-ray uploaded successfully.',
      data: patientEvent,
    };
  }
}
