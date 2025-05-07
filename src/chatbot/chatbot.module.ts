import { Module } from '@nestjs/common';
import { TrinksService } from 'src/trinks/trinks.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { SessionService } from './services/session.service';
import { ChatbotController } from './controllers/chatbot.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Agendamento,
  AgendamentoSchema,
} from 'src/agendamentos/agendamentos.schema';
import { FreeMessageProcessorService } from './services/free-message-processor.service';
import { GptService } from 'src/openai/openai.service';
import { TrinksApiService } from 'src/trinks/trinks.api.service';

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
