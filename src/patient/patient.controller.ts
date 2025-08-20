import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { InvitePatientDto } from './dto/invite-patient.dto';
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
import { GetPatientsDto } from './dto/get-patients.dto';

@ApiTags('Patient Management')
@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Practitioner)
  @ApiBearerAuth()
  @ApiBody({ type: InvitePatientDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Patient invitation has been sent successfully.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A user with this email already exists.',
  })
  invitePatient(
    @GetUser('id') practitionerId: string,
    @Body() invitePatientDto: InvitePatientDto,
  ) {
    return this.patientService.invitePatient(practitionerId, invitePatientDto);
  }

  @Get('patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Practitioner)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by patient name or email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a paginated list of patients.',
  })
  getPatients(
    @GetUser('id') practitionerId: string,
    @Query() query: GetPatientsDto,
  ) {
    return this.patientService.getPatientsForPractitioner(
      practitionerId,
      query,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.Practitioner, UserRole.Admin, UserRole.Patient)
  @ApiBearerAuth()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the details for the specified patient.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Patient not found.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to view this patient.',
  })
  getPatientDetails(
    @GetUser() user: Omit<AppUser, 'passwordHash'>,
    @Param('id') patientId: string,
  ) {
    return this.patientService.getPatientDetails(user, patientId);
  }
}
