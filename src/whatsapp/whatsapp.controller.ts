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

    // Verificando se a propriedade 'entry' existe
    if (!body.entry) {
      console.error('Propriedade "entry" não encontrada no webhook');
      return { status: 'error', message: 'Propriedade "entry" não encontrada' };
    }

    // Verificando se há mensagens na entrada
    const entry = body.entry[0];
    if (!entry?.changes || entry.changes.length === 0) {
      console.error('Nenhuma mudança encontrada no webhook');
      return { status: 'error', message: 'Nenhuma mudança encontrada' };
    }

    const messageData = entry.changes[0]?.value?.messages;
    if (!messageData || messageData.length === 0) {
      console.error('Nenhuma mensagem encontrada');
      return { status: 'error', message: 'Nenhuma mensagem encontrada' };
    }

    const userMessage = messageData[0]?.text?.body;
    const userPhone = messageData[0]?.from;

    // Verificando se a mensagem e o número de telefone estão presentes
    if (!userMessage || !userPhone) {
      console.error('Mensagem ou número de telefone não encontrados');
      return {
        status: 'error',
        message: 'Mensagem ou número de telefone não encontrados',
      };
    }

    console.log(`Recebido: ${userMessage} | De: ${userPhone}`);

    // 🔹 Obtendo resposta do GPT
    const gptResponse = await this.gptService.getResponse(userMessage);

    // Verificando se a resposta do GPT é válida
    if (!gptResponse) {
      console.error('Resposta do GPT não encontrada');
      return { status: 'error', message: 'Resposta do GPT não encontrada' };
    }

    // 🔹 Enviando resposta para o usuário pelo WhatsApp
    try {
      await this.whatsappService.sendMessage(userPhone, gptResponse);
    } catch (error) {
      console.error('Erro ao enviar mensagem para o WhatsApp', error);
      return {
        status: 'error',
        message: 'Erro ao enviar mensagem para o WhatsApp',
      };
    }

    return { status: 'success' };
  }
}
