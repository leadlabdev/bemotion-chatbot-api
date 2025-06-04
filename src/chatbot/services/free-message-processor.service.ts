import { Injectable } from '@nestjs/common';
import { SessionService } from './session.service';
import { TwilioService } from '@/twilio/twilio.service';
import { GptService } from '@/openai/openai.service';

@Injectable()
export class FreeMessageProcessorService {
  private messageBuffers = new Map<string, string[]>();
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private gptService: GptService,
    private sessionService: SessionService,
    private twilioService: TwilioService,
  ) {}

  async processMessage(telefone: string, message: string): Promise<void> {
    // Adiciona mensagem ao buffer
    if (!this.messageBuffers.has(telefone)) {
      this.messageBuffers.set(telefone, []);
    }
    const buffer = this.messageBuffers.get(telefone)!;
    buffer.push(message);

    // Reseta o temporizador
    if (this.timers.has(telefone)) {
      clearTimeout(this.timers.get(telefone));
    }

    // Define um novo temporizador para processar mensagens acumuladas
    this.timers.set(
      telefone,
      setTimeout(async () => {
        const messages = this.messageBuffers.get(telefone) || [];
        this.messageBuffers.delete(telefone); // Limpa o buffer
        this.timers.delete(telefone); // Limpa o temporizador

        // Concatena mensagens em uma única string
        const combinedMessage = messages.join('\n');
        console.log(
          `[FreeMessageProcessorService] Processando mensagem combinada: telefone=${telefone}, message="${combinedMessage}"`,
        );

        const session = await this.sessionService.getSession(telefone);

        // Adiciona mensagem ao histórico da sessão
        session.messages = session.messages || [];
        session.messages.push({ role: 'user', content: combinedMessage });
        await this.sessionService.updateSession(telefone, session);

        try {
          const response = await this.gptService.generateResponse(
            combinedMessage,
            telefone,
            session,
          );
          console.log(
            `[FreeMessageProcessorService] Resposta do GptService: ${response}`,
          );

          await this.twilioService.sendMessage(telefone, response);
          console.log(
            `[FreeMessageProcessorService] Mensagem enviada via Twilio para ${telefone}`,
          );

          // Adiciona resposta do assistente ao histórico
          session.messages.push({ role: 'assistant', content: response });
          await this.sessionService.updateSession(telefone, session);
        } catch (error) {
          console.error(
            `[FreeMessageProcessorService] Erro ao processar mensagem:`,
            error,
          );
          throw new Error('Falha ao processar mensagem');
        }
      }, 3000), // Aguarda 3 segundos
    );
  }
}
