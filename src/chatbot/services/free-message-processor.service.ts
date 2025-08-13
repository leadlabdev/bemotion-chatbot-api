import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from './session.service';
import { TwilioService } from '@/twilio/twilio.service';
import { GptService } from '@/openai/openai.service';

interface MessageBuffer {
  messages: string[];
  timer: NodeJS.Timeout;
  createdAt: Date;
}

@Injectable()
export class FreeMessageProcessorService {
  private readonly logger = new Logger(FreeMessageProcessorService.name);
  private messageBuffers = new Map<string, MessageBuffer>();
  private readonly BUFFER_TIMEOUT = 7000;
  private readonly MAX_BUFFER_SIZE = 10;
  private readonly MAX_BUFFER_AGE = 30000;

  constructor(
    private readonly gptService: GptService,
    private readonly sessionService: SessionService,
    private readonly twilioService: TwilioService,
  ) {
    setInterval(() => this.cleanupOldBuffers(), 60000);
  }

  async processMessage(telefone: string, message: string): Promise<void> {
    try {
      if (!telefone || !message || message.trim().length === 0) {
        this.logger.warn('Telefone ou mensagem inválidos', {
          telefone,
          message,
        });
        return;
      }

      const trimmedMessage = message.trim();
      this.logger.log(`Recebendo mensagem de ${telefone}: "${trimmedMessage}"`);

      this.addToBuffer(telefone, trimmedMessage);
    } catch (error) {
      this.logger.error(`Erro ao processar mensagem de ${telefone}:`, error);
      await this.sendErrorMessage(telefone);
    }
  }

  private addToBuffer(telefone: string, message: string): void {
    let buffer = this.messageBuffers.get(telefone);

    if (!buffer) {
      buffer = {
        messages: [],
        timer: null as any,
        createdAt: new Date(),
      };
      this.messageBuffers.set(telefone, buffer);
    } else {
      if (buffer.timer) {
        clearTimeout(buffer.timer);
      }
    }

    buffer.messages.push(message);

    if (buffer.messages.length >= this.MAX_BUFFER_SIZE) {
      this.logger.log(
        `Buffer cheio para ${telefone}, processando imediatamente`,
      );
      this.processBufferedMessages(telefone);
      return;
    }

    const bufferAge = Date.now() - buffer.createdAt.getTime();
    if (bufferAge >= this.MAX_BUFFER_AGE) {
      this.logger.log(
        `Buffer antigo para ${telefone}, processando imediatamente`,
      );
      this.processBufferedMessages(telefone);
      return;
    }

    buffer.timer = setTimeout(() => {
      this.processBufferedMessages(telefone);
    }, this.BUFFER_TIMEOUT);

    this.logger.debug(
      `Mensagem adicionada ao buffer de ${telefone}. Total: ${buffer.messages.length}`,
    );
  }

  private async processBufferedMessages(telefone: string): Promise<void> {
    const buffer = this.messageBuffers.get(telefone);
    if (!buffer || buffer.messages.length === 0) {
      return;
    }

    this.messageBuffers.delete(telefone);
    if (buffer.timer) {
      clearTimeout(buffer.timer);
    }

    const messages = [...buffer.messages];
    const combinedMessage = messages.join('\n');

    this.logger.log(
      `Processando mensagens combinadas de ${telefone}: "${combinedMessage}"`,
    );

    try {
      await this.sessionService.addMessage(telefone, 'user', combinedMessage);

      const session = await this.sessionService.getSession(telefone);

      const response = await this.gptService.generateResponse(
        combinedMessage,
        telefone,
        session,
      );

      if (!response || response.trim().length === 0) {
        throw new Error('Resposta vazia do GPT service');
      }

      this.logger.log(
        `Resposta gerada para ${telefone}: ${response.substring(0, 100)}${response.length > 100 ? '...' : ''}`,
      );

      await this.twilioService.sendMessage(telefone, response);
      this.logger.log(`Mensagem enviada via Twilio para ${telefone}`);

      await this.sessionService.addMessage(telefone, 'assistant', response);

      const stats = await this.sessionService.getSessionStats(telefone);
      this.logger.debug(`Estatísticas da sessão ${telefone}:`, stats);
    } catch (error) {
      this.logger.error(`Erro ao processar mensagens de ${telefone}:`, error);
      await this.sendErrorMessage(telefone);
    }
  }

  private async sendErrorMessage(telefone: string): Promise<void> {
    try {
      const errorMessage =
        'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.';
      await this.twilioService.sendMessage(telefone, errorMessage);
      this.logger.log(`Mensagem de erro enviada para ${telefone}`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem de erro para ${telefone}:`,
        error,
      );
    }
  }

  private cleanupOldBuffers(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [telefone, buffer] of this.messageBuffers.entries()) {
      const bufferAge = now - buffer.createdAt.getTime();

      if (bufferAge > this.MAX_BUFFER_AGE * 2) {
        if (buffer.timer) {
          clearTimeout(buffer.timer);
        }
        this.messageBuffers.delete(telefone);
        cleanedCount++;
        this.logger.warn(`Buffer antigo removido para ${telefone}`);
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(
        `Limpeza de buffers: ${cleanedCount} buffers antigos removidos`,
      );
    }
  }
}
