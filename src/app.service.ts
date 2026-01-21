import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Welcome to GitCore API',
      version: '1.0.0',
      documentation: '/api',
    };
  }
}
