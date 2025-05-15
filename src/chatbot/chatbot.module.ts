import { Module } from '@nestjs/common';
import { SessionService } from './services/session.service';
import { ChatbotController } from './controllers/chatbot.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FreeMessageProcessorService } from './services/free-message-processor.service';
import { TwilioService } from '@/twilio/twilio.service';
import { GptService } from '@/openai/openai.service';
import { TrinksService } from '@/trinks/trinks.service';
import { TrinksApiService } from '@/trinks/trinks.api.service';
import {
  Agendamento,
  AgendamentoSchema,
} from '@/agendamentos/agendamentos.schema';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([
      { name: Agendamento.name, schema: AgendamentoSchema },
    ]),
  ],
  providers: [
    TwilioService,
    GptService,
    TrinksService,
    TrinksApiService,
    SessionService,
    FreeMessageProcessorService,
  ],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
