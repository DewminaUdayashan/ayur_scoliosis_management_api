import { Module } from '@nestjs/common';
import { VideoCallGateway } from './video-call.gateway';
import { VideoCallService } from './video-call.service';
import { VideoCallController } from './video-call.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VideoCallController],
  providers: [VideoCallGateway, VideoCallService],
  exports: [VideoCallService],
})
export class VideoCallModule {}
