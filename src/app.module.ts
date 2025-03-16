import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { GptService } from './openai/openai.service';

import { HttpModule } from '@nestjs/axios';
import { InteracaoModule } from './interacao/interacao.module';
import { InteracaoService } from './interacao/interacao.service';

import { TwilioService } from './twilio/twilio.service';
import { ChatbotController } from './chatbot/chatbot.controller';
import { TrinksService } from './trinks/trinks.service';

@Module({
  imports: [
    ConfigModule.forRoot(), // Carregar variáveis de ambiente
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true, // Carrega automaticamente as entidades
        synchronize: true, // Não use em produção! Apenas para desenvolvimento.
      }),
    }),
    InteracaoModule,

    HttpModule,
  ],
  controllers: [AppController, ChatbotController],
  providers: [AppService, GptService, TwilioService, TrinksService],
})
export class AppModule {
  constructor() {
    // Console logs para checar as variáveis de ambiente
    console.log('DB Host:', process.env.DB_HOST); // Exibe o host do banco
    console.log('DB Port:', process.env.DB_PORT); // Exibe a porta
    console.log('DB User:', process.env.DB_USER); // Exibe o nome de usuário
    console.log('DB Password:', process.env.DB_PASSWORD); // Exibe a senha
    console.log('DB Name:', process.env.DB_NAME); // Exibe o nome do banco
  }
}
