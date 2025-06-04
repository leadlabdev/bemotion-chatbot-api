import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotController } from './controllers/chatbot.controller';
import { SessionService } from './services/session.service';
import { FreeMessageProcessorService } from './services/free-message-processor.service';
import { TwilioService } from '@/twilio/twilio.service';
import { TrinksService } from '@/trinks/trinks.service';
import { TrinksApiService } from '@/trinks/trinks.api.service';

import {
  Agendamento,
  AgendamentoSchema,
} from '@/agendamentos/agendamentos.schema';
import { GptModule } from '@/openai/openai.module';

@Module({
  imports: [
    ConfigModule, // Importa ConfigModule para fornecer ConfigService
    HttpModule,
    MongooseModule.forFeature([
      { name: Agendamento.name, schema: AgendamentoSchema },
    ]),
    forwardRef(() => GptModule), // Usa forwardRef para evitar dependência circular
  ],
  providers: [
    SessionService,
    FreeMessageProcessorService,
    TwilioService,
    TrinksService,
    TrinksApiService,
  ],
  controllers: [ChatbotController],
  exports: [TrinksService], // Exporta TrinksService para o GptModule
})
export class ChatbotModule {}
