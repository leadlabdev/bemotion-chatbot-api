import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { GptService } from 'src/openai/openai.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly gptService: GptService,
  ) {}

  @Post('send')
  async sendMessage(@Body() body: { to: string; message: string }) {
    return this.whatsappService.sendMessage(body.to, body.message);
  }

  @Post('webhook')
  async handleIncomingMessage(@Body() body: any) {
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
