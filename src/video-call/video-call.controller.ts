import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { VideoCallService } from './video-call.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Video Call Management')
@Controller('video-call')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VideoCallController {
  constructor(private readonly videoCallService: VideoCallService) {}

  @Get('room/appointment/:appointmentId')
  @ApiOperation({
    summary: 'Get video call room by appointment ID',
    description:
      'Retrieves the video call room information for a specific appointment. Only the patient and practitioner associated with the appointment can access this.',
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'The ID of the appointment',
    type: String,
  })
  async getRoomByAppointment(
    @Param('appointmentId') appointmentId: string,
    @Request() req,
  ) {
    return this.videoCallService.getRoomByAppointmentId(
      appointmentId,
      req.user.id,
    );
  }

  @Post('room/appointment/:appointmentId/create')
  @ApiOperation({
    summary: 'Create a video call room for an appointment',
    description:
      'Manually creates a video call room for an appointment. Note: Rooms are automatically created when a remote appointment is scheduled.',
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'The ID of the appointment',
    type: String,
  })
  async createRoomForAppointment(
    @Param('appointmentId') appointmentId: string,
  ) {
    const roomId =
      await this.videoCallService.createRoomForAppointment(appointmentId);
    return { roomId };
  }
}
