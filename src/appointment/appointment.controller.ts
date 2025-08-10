import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppUser, UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { RespondToAppointmentDto } from './dto/respond-to-appointment.dto';
import { GetAppointmentDatesDto } from './dto/get-appointment-dates.dto';

@ApiTags('Appointment Management')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes in this controller
@ApiBearerAuth()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'patientId',
    required: false,
    type: String,
    description: 'Filter by patient ID (Practitioner only).',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: "Sort by 'appointmentDateTime'.",
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of appointments for the authenticated user.',
  })
  getAppointments(
    @GetUser() user: Omit<AppUser, 'passwordHash'>, // Get the full user object
    @Query() getAppointmentsDto: GetAppointmentsDto,
  ) {
    return this.appointmentService.getAppointments(user, getAppointmentsDto);
  }

  @Get('upcoming')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Patient)
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Returns a list of upcoming appointments for the authenticated patient.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User is not authenticated or is not a patient.',
  })
  getUpcomingAppointments(@GetUser('id') patientId: string) {
    return this.appointmentService.getUpcomingAppointmentsForPatient(patientId);
  }

  @Get('dates')
  @ApiQuery({
    name: 'start',
    type: String,
    description: 'Start of the date range (YYYY-MM-DD).',
  })
  @ApiQuery({
    name: 'end',
    type: String,
    description: 'End of the date range (YYYY-MM-DD).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a list of dates that have appointments.',
  })
  getAppointmentDates(
    @GetUser() user: Omit<AppUser, 'passwordHash'>,
    @Query() query: GetAppointmentDatesDto,
  ) {
    return this.appointmentService.getAppointmentDates(user, query);
  }

  @Get(':id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the details of the specified appointment.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Appointment not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view this appointment.',
  })
  getAppointmentDetails(
    @GetUser() user: Omit<AppUser, 'passwordHash'>,
    @Param('id') appointmentId: string,
  ) {
    return this.appointmentService.getAppointmentDetails(user, appointmentId);
  }

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

  @Patch(':id')
  @Roles(UserRole.Practitioner)
  @ApiBody({ type: UpdateAppointmentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The appointment has been successfully updated.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Appointment not found.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'The requested time slot is not available.',
  })
  updateAppointment(
    @GetUser('id') practitionerId: string,
    @Param('id') appointmentId: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.updateAppointment(
      practitionerId,
      appointmentId,
      updateAppointmentDto,
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

  @Patch(':id/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Patient)
  @ApiBody({ type: RespondToAppointmentDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully responded to the appointment.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Appointment not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot respond to this appointment.',
  })
  respondToAppointment(
    @GetUser('id') patientId: string,
    @Param('id') appointmentId: string,
    @Body() respondDto: RespondToAppointmentDto,
  ) {
    return this.appointmentService.respondToAppointment(
      patientId,
      appointmentId,
      respondDto,
    );
  }
}
