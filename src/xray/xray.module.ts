import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { XRayService } from './xray.service';
import { XRayController } from './xray.controller';
import { ClassificationService } from './services/classification.service';

@Module({
  imports: [PrismaModule],
  controllers: [XRayController],
  providers: [XRayService, ClassificationService],
})
export class XRayModule {}
