import { Module } from '@nestjs/common';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';
import { GptService } from 'src/openai/openai.service';
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
    AgendamentoService,
    SessionService,
    FreeMessageProcessorService,
  ],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
