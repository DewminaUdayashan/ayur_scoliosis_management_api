// src/appointment/appointment.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Appointment Management')
@Controller('appointment')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes in this controller
@ApiBearerAuth()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('schedule')
  @Roles(UserRole.Practitioner)
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The appointment has been successfully scheduled.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The requested time slot is not available.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Patient not found.',
  })
  createAppointment(
    @GetUser('id') practitionerId: string,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    return this.appointmentService.createAppointment(
      practitionerId,
      createAppointmentDto,
    );
  }

  @Get('check-availability')
  @Roles(UserRole.Practitioner)
  @ApiQuery({
    name: 'dateTime',
    type: String,
    description: 'ISO 8601 date string to check.',
  })
  @ApiQuery({
    name: 'durationInMinutes',
    type: Number,
    description: 'Duration to check.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns whether the time slot is available.',
  })
  checkAvailability(
    @GetUser('id') practitionerId: string,
    @Query() checkAvailabilityDto: CheckAvailabilityDto,
  ) {
    return this.appointmentService.checkAvailability(
      practitionerId,
      checkAvailabilityDto,
    );
  }
}
