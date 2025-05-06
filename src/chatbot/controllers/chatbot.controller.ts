import { Controller, Post, Body } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { TrinksService } from 'src/trinks/trinks.service';
import { FreeMessageProcessorService } from '../services/free-message-processor.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly handleFreeMessage: FreeMessageProcessorService,
    private readonly trinksService: TrinksService,
  ) {}

  getSession(telefone: string): any {
    return this.sessionService.getSession(telefone);
  }

  updateSession(telefone: string, session: any): void {
    this.sessionService.updateSession(telefone, session);
  }

  @Post('webhook')
  async handleIncomingMessage(@Body() body) {
    const { From, Body: userMessage } = body;

    const telefoneFormatado = From.replace('whatsapp:', '')
      .replace('+55', '')
      .trim();

    const session = this.getSession(telefoneFormatado);
    const result =
      await this.trinksService.identificarClientePorTelefone(telefoneFormatado);

    if (!result.success) {
      return 'error';
    }

    const clientes = result.clientes;

    await this.handleFreeMessage.processMessage(telefoneFormatado, userMessage);
    return { success: true };
  }
}
