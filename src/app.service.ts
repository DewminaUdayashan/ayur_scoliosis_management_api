import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health(): { message: string; version: string; description: string } {
    return {
      message: 'Welcome to the Ayur Scoliosis Management API!',
      version: '1.0.0',
      description:
        'This API provides functionalities for managing scoliosis patients, including inviting patients, managing appointments, and more.',
    };
  }
}
