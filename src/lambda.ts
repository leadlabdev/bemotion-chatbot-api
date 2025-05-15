import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';

let cachedServer;

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // Configurações da sua aplicação
  app.enableCors();

  await app.init();

  return serverlessExpress({
    app: expressApp,
  });
}

export const handler = async (event, context, callback) => {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }

  return cachedServer(event, context, callback);
};
