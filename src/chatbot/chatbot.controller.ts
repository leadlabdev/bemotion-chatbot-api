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
    const { From, Body: userMessage } = body;

    try {
      // Log para debug
      console.log('Mensagem recebida de:', From);
      console.log('Conteúdo da mensagem:', userMessage);

      // Gerar resposta com OpenAI
      const reply = await this.openAiService.getResponse(userMessage);

      // Enviar resposta de volta via WhatsApp
      const result = await this.twilioService.sendMessage(From, reply);

      // Log do resultado
      console.log('Mensagem enviada com sucesso:', result.sid);

      return {
        success: true,
        reply,
        messageSid: result.sid,
      };
    } catch (error) {
      console.error('Erro ao processar a mensagem:', error);
      return { success: false, message: 'Erro ao processar a mensagem.' };
    }
  }
}
