import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClientCache } from './client.cache';
import { ServiceCache } from './service.cache';
import { ChatbotModule } from '@/chatbot/chatbot.module';
import OpenAI from 'openai';
import { ThreadManager } from './openai.thread-manager';
import { GptService } from './openai.service';
import { GptConfig } from './openai.config';
import { ToolExecutor } from './gpt.tool.executor';
import { SessionService } from '@/chatbot/services/session.service';
import { RedisService } from '@/redis/redis.service';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => ChatbotModule), // Importa ChatbotModule para acessar TrinksService
  ],
  providers: [
    GptService,
    GptConfig,
    {
      provide: ThreadManager,
      useFactory: (openai: OpenAI) => new ThreadManager(openai),
      inject: ['OpenAI'],
    },
    ToolExecutor,
    ClientCache,
    ServiceCache,
    SessionService,
    RedisService,
    {
      provide: 'OpenAI',
      useFactory: (gptConfig: GptConfig) =>
        new OpenAI({ apiKey: gptConfig.apiKey }),
      inject: [GptConfig],
    },
  ],
  exports: [GptService],
})
export class GptModule {}
