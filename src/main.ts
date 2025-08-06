import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path'; // <-- Import join
import { NestExpressApplication } from '@nestjs/platform-express'; // <-- Import NestExpressApplication

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // <-- Use NestExpressApplication

  // Enable transformation to allow class-transformer to work with incoming data
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // This line makes the 'uploads' folder publicly accessible
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('Ayurveda Clinic API')
    .setDescription(
      'API documentation for the Ayurvedic clinic management system',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
