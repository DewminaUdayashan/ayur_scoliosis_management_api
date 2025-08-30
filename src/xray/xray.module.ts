import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { XRayService } from './xray.service';
import { XRayController } from './xray.controller';

@Module({
  imports: [PrismaModule],
  controllers: [XRayController],
  providers: [XRayService],
})
export class XRayModule {}
