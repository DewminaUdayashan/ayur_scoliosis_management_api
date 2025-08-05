import { Controller, Post, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { PatientService } from './patient.service';
import { InvitePatientDto } from './dto/invite-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/user.decorator';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

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
}
