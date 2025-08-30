import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/auth/decorators/user.decorator';
import { UploadXrayDto } from './dto/upload-xray.dto';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { XRayService } from './xray.service';

@ApiTags('X-Ray Management')
@Controller('xray')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class XRayController {
  constructor(private readonly xrayService: XRayService) {}

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
}
