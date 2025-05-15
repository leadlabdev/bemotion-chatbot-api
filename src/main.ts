// src/main.ts
import './register-paths';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import serverlessExpress from '@vendia/serverless-express';

// Para desenvolvimento local
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
}

// Para ambiente serverless (Vercel)
let server: any;

async function bootstrapServer() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.enableCors();
  await app.init();

  return serverlessExpress({
    app: expressApp,
  });
}

// Exporta o handler para Vercel
export const handler = async (event: any, context: any) => {
  if (!server) {
    server = await bootstrapServer();
  }
  return server(event, context);
};

// Inicia o servidor apenas se não estiver em ambiente serverless
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
