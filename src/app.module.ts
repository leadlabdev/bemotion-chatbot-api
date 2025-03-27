import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose'; // Usar apenas Mongoose
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GptService } from './openai/openai.service';
import { HttpModule } from '@nestjs/axios';
import { TwilioService } from './twilio/twilio.service';
import { ChatbotController } from './chatbot/chatbot.controller';
import { TrinksService } from './trinks/trinks.service';
import { RedisService } from './redis/redis.service';
import { AgendamentoService } from './agendamentos/agendamentos.service';
import {
  Agendamento,
  AgendamentoSchema,
} from './agendamentos/agendamentos.schema';

@Module({
  imports: [
    ConfigModule.forRoot(), // Carregar variáveis de ambiente
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'), // URI do MongoDB
      }),
    }),
    MongooseModule.forFeature([
      { name: Agendamento.name, schema: AgendamentoSchema },
    ]), // Registrar o schema
    HttpModule,
  ],
  controllers: [AppController, ChatbotController],
  providers: [
    AppService,
    GptService,
    TwilioService,
    TrinksService,
    RedisService,
    AgendamentoService,
  ],
})
export class AppModule {
  constructor() {
    // Console log para checar a variável de ambiente do MongoDB
    console.log('MongoDB URI:', process.env.MONGODB_URI);
  }
}
