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
    mensagem: string, // Primeiro parâmetro é a mensagem do usuário
    nome?: string, // Segundo parâmetro é o nome do cliente
  ): Promise<void> {
    try {
      console.log('MensagemLivreService - mensagem:', mensagem, 'nome:', nome);

      // Chamar diretamente o gptService sem passar pelo formatador
      const response = await this.gptService.generateResponse(
        mensagem, // A mensagem do usuário como primeiro parâmetro
        nome, // O nome como segundo parâmetro
        telefone, // O telefone como terceiro parâmetro
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
