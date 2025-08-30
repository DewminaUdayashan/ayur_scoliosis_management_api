import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { PatientEventService } from './patient-event.service';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/user.decorator';
import { AppUser, UserRole } from '@prisma/client';
import { GetPatientEventsDto } from './dto/get-patient-events.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Patient Event Timeline')
@Controller('patient-event')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PatientEventController {
  constructor(private readonly patientEventService: PatientEventService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns a paginated list of a patient's events.",
  })
  getPatientEvents(
    @GetUser() user: Omit<AppUser, 'passwordHash'>,
    @Query() query: GetPatientEventsDto,
  ) {
    return this.patientEventService.getPatientEvents(user, query);
  }

  @Get(':patientId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "Returns a paginated list of a specific patient's events (Admin only).",
  })
  getPatientEventsForAdmin(
    @GetUser() user: Omit<AppUser, 'passwordHash'>,
    @Param('patientId') patientId: string,
    @Query() query: GetPatientEventsDto,
  ) {
    // Manually add the patientId to the query DTO for the service
    query.patientId = patientId;
    return this.patientEventService.getPatientEvents(user, query);
  }
}
