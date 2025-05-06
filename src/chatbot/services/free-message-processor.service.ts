import { Injectable } from '@nestjs/common';
import { SessionService } from './session.service';
import { GptService } from 'src/openai/openai.service';
import { TwilioService } from 'src/twilio/twilio.service';

@Injectable()
export class FreeMessageProcessorService {
  constructor(
    private gptService: GptService,
    private sessionService: SessionService,
    private twilioService: TwilioService,
  ) {}

  async processMessage(telefone: string, message: string): Promise<string> {
    const session = await this.sessionService.getSession(telefone);
    console.log(
      `[FreeMessageProcessorService] Processando mensagem: message="${message}", telefone=${telefone}, session=`,
      session,
    );

    const response = await this.gptService.generateResponse(
      message,
      telefone,
      session,
    );
    console.log(
      `[FreeMessageProcessorService] Resposta do GptService: ${response}`,
    );

    try {
      await this.twilioService.sendMessage(telefone, response);
      console.log(
        `[FreeMessageProcessorService] Mensagem enviada via Twilio para ${telefone}`,
      );
    } catch (error) {
      console.error(
        `[FreeMessageProcessorService] Erro ao enviar mensagem via Twilio:`,
        error,
      );

      throw new Error('Falha ao enviar mensagem para o cliente');
    }

    return response;
  }
}
