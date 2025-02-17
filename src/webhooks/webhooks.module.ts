import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { HttpModule } from '@nestjs/axios'; // Necessário para o WhatsappService
import { ConfigModule } from '@nestjs/config'; // Necessário se OpenAiService usar ConfigService
import { InteracaoModule } from 'src/interacao/interacao.module';
import { GptService } from 'src/openai/openai.service';

@Module({
  imports: [HttpModule, ConfigModule, InteracaoModule], // Importando módulos necessários
  controllers: [WebhooksController],
  providers: [GptService, WhatsappService], // Registrando serviços
})
export class WebhooksModule {}
