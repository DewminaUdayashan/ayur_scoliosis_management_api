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
import { XRayController } from './xray/xray.controller';
import { XRayService } from './xray/xray.service';
import { XRayModule } from './xray/xray.module';

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
  ],
  controllers: [AppController, XRayController],
  providers: [AppService, XRayService],
})
export class AppModule {}
