import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // This pipe will automatically validate incoming request bodies against your DTOs
  app.useGlobalPipes(new ValidationPipe());

  // Swagger (OpenAPI) Configuration
  const config = new DocumentBuilder()
    .setTitle('Ayurveda Clinic API')
    .setDescription(
      'API documentation for the Ayurvedic clinic management system',
    )
    .setVersion('1.0')
    .addBearerAuth() // This line adds support for Bearer token authentication in Swagger
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // The API documentation will be available at /api

  await app.listen(3000);
}
bootstrap();
