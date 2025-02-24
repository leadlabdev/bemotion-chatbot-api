import { Controller, Post, Body } from '@nestjs/common';
import { TwilioService } from '../twilio/twilio.service';
import { GptService } from 'src/openai/openai.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly openAiService: GptService,
  ) {}

  @Post('webhook')
  async handleIncomingMessage(@Body() body) {
    const { From, Body: userMessage } = body; // Pegando remetente e mensagem do usuário

    try {
      // Gerar resposta com OpenAI
      const reply = await this.openAiService.getResponse(userMessage);

      // Enviar resposta de volta via WhatsApp
      await this.twilioService.sendMessage(From, reply);

      console.log('Mensagem recebida:', body);
      console.log('Resposta enviada:', reply); // Log da resposta enviada
      return { success: true, reply }; // Retornando também a resposta gerada
    } catch (error) {
      console.error('Erro ao processar a mensagem:', error);
      return { success: false, message: 'Erro ao processar a mensagem.' };
    }
  }
}
