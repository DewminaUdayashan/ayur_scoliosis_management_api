import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { ConfigModule } from '@nestjs/config';
import { PatientModule } from './patient/patient.module';
import { ProfileModule } from './profile/profile.module';
import { AppointmentModule } from './appointment/appointment.module';
import { XRayModule } from './xray/xray.module';
import { PatientEventService } from './patient-event/patient-event.service';
import { PatientEventController } from './patient-event/patient-event.controller';
import { PatientEventModule } from './patient-event/patient-event.module';
import { VideoCallModule } from './video-call/video-call.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make the ConfigModule available globally
    }),
    AuthModule,
    PrismaModule,
    EmailModule,
    PatientModule,
    ProfileModule,
    AppointmentModule,
    XRayModule,
    PatientEventModule,
    VideoCallModule,
  ],
  controllers: [AppController, PatientEventController],
  providers: [AppService, PatientEventService],
})
export class AppModule {}
