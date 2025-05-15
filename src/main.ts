// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aceita application/x-www-form-urlencoded (Twilio usa isso)
  app.use(bodyParser.urlencoded({ extended: true }));

  // Se ainda quiser aceitar JSON também:
  app.use(bodyParser.json());

  await app.listen(3000);
}
bootstrap();
