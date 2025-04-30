import { Injectable } from '@nestjs/common';
import { GptService } from 'src/openai/openai.service';
import { TwilioService } from 'src/twilio/twilio.service';

@Injectable()
export class MensagemLivreService {
  constructor(
    private readonly gptService: GptService,
    private readonly twilioService: TwilioService,
  ) {}

  async handleFreeFormMessage(
    telefone: string,
    mensagem: string,
    nome?: string,
  ): Promise<void> {
    try {
      console.log('MensagemLivreService - mensagem:', mensagem, 'nome:', nome);
      const response = await this.gptService.generateResponse(
        mensagem,
        nome,
        telefone,
      );
      await this.twilioService.sendMessage(telefone, response);
    } catch (error) {
      console.error('Erro ao gerar resposta livre:', error);
      const errorMessage =
        'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
      await this.twilioService.sendMessage(telefone, errorMessage);
    }
  }
}
