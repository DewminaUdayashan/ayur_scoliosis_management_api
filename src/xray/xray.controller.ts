import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  HttpStatus,
  Get,
  Query,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AppUser, UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/auth/decorators/user.decorator';
import { UploadXrayDto } from './dto/upload-xray.dto';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { XRayService } from './xray.service';
import { GetXraysDto } from './dto/get-xrays.dto';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from './dto/measurement.dto';
import { MeasurementService } from './services/measurement.service';

@ApiTags('X-Ray Management')
@Controller('xray')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class XRayController {
  constructor(
    private readonly xrayService: XRayService,
    private readonly measurementService: MeasurementService,
  ) {}

  @Get()
  @Roles(UserRole.Patient, UserRole.Practitioner)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a paginated list of X-ray images.',
  })
  getXRays(
    @GetUser() user: Omit<AppUser, 'passwordHash'>,
    @Query() query: GetXraysDto,
  ) {
    return this.xrayService.getXRays(user, query);
  }

  @Post('upload')
  @Roles(UserRole.Patient)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('xrayImage', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/xrays';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = randomBytes(16).toString('hex');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiBody({
    description: 'X-ray image and optional notes.',
    schema: {
      type: 'object',
      properties: {
        xrayImage: {
          type: 'string',
          format: 'binary',
        },
        notes: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'X-ray has been successfully uploaded.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No image file was provided.',
  })
  uploadXray(
    @GetUser('id') patientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadXrayDto: UploadXrayDto,
  ) {
    return this.xrayService.uploadXrayImage(patientId, file, uploadXrayDto);
  }

  @Post('measurements')
  @Roles(UserRole.Practitioner, UserRole.Admin)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Measurements saved successfully. Previous measurements replaced.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'X-ray image not found.',
  })
  createMeasurements(
    @GetUser('id') practitionerId: string,
    @Body() createMeasurementDto: CreateMeasurementDto,
  ) {
    return this.measurementService.createMeasurements(
      createMeasurementDto,
      practitionerId,
    );
  }

  @Get('measurements/:xrayImageId')
  @Roles(UserRole.Patient, UserRole.Practitioner, UserRole.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns measurements for the specified X-ray image.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'X-ray image not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to this X-ray image.',
  })
  getMeasurements(
    @Param('xrayImageId') xrayImageId: string,
    @GetUser() user: Omit<AppUser, 'passwordHash'>,
  ) {
    return this.measurementService.getMeasurementsByXrayId(xrayImageId, user);
  }

  @Put('measurements/:measurementId')
  @Roles(UserRole.Practitioner, UserRole.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Measurement updated successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Measurement not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only update measurements you created.',
  })
  updateMeasurement(
    @Param('measurementId') measurementId: string,
    @GetUser('id') practitionerId: string,
    @Body() updateMeasurementDto: UpdateMeasurementDto,
  ) {
    return this.measurementService.updateMeasurement(
      measurementId,
      updateMeasurementDto,
      practitionerId,
    );
  }

  @Delete('measurements/:measurementId')
  @Roles(UserRole.Practitioner, UserRole.Admin)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Measurement deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Measurement not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You can only delete measurements you created.',
  })
  deleteMeasurement(
    @Param('measurementId') measurementId: string,
    @GetUser('id') practitionerId: string,
  ) {
    return this.measurementService.deleteMeasurement(
      measurementId,
      practitionerId,
    );
  }
}
