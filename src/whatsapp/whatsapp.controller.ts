import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { GptService } from 'src/openai/openai.service';
import { ConfigService } from '@nestjs/config';

@Controller('whatsapp')
export class WhatsappController {
  private readonly VERIFY_TOKEN: string;

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly gptService: GptService,
    private readonly configService: ConfigService, // Certifique-se de que o ConfigService está sendo injetado
  ) {
    // Acessando o token do arquivo .env
    this.VERIFY_TOKEN =
      this.configService.get<string>('META_WHATSAPP_VERIFY_TOKEN') || '';
  }

  // Verificação do Webhook (GET)
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') token: string,
  ) {
    if (mode === 'subscribe' && token === this.VERIFY_TOKEN) {
      console.log('Webhook verificado com sucesso!');
      return challenge; // Retorna o challenge enviado pelo Facebook
    }
    console.error('Falha na verificação do webhook!');
    return 'Erro na verificação do webhook';
  }

  // Envio de mensagens (POST)
  @Post('send')
  async sendMessage(@Body() body: { to: string; message: string }) {
    return this.whatsappService.sendMessage(body.to, body.message);
  }

  // Processamento de mensagens recebidas (POST)
  @Post('webhook')
  async handleIncomingMessage(@Body() body: any) {
    console.log('Corpo do Webhook:', JSON.stringify(body, null, 2));
    if (!body.entry) {
      console.error('Propriedade "entry" não encontrada no webhook');
      return { status: 'error', message: 'Propriedade "entry" não encontrada' };
    }
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) return;

    const userMessage = messages[0].text?.body;
    const userPhone = messages[0].from;

    console.log(`Recebido: ${userMessage} | De: ${userPhone}`);

    // 🔹 Obtendo resposta do GPT
    const gptResponse = await this.gptService.getResponse(userMessage);

    // 🔹 Enviando resposta para o usuário pelo WhatsApp
    await this.whatsappService.sendMessage(userPhone, gptResponse);

    return { status: 'success' };
  }
}
