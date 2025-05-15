import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from 'aws-serverless-express';
import { AppModule } from './app.module';
import express from 'express';
import { Server } from 'http';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  await app.init();
}

let cachedServer: Server<any>;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
) => {
  if (!cachedServer) {
    await bootstrap();
    cachedServer = serverlessExpress.createServer(server);
  }
  return serverlessExpress.proxy(cachedServer, event, context, 'PROMISE')
    .promise;
};
