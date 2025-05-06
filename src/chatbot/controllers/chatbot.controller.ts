import { Controller, Post, Body } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { FreeMessageProcessorService } from '../services/free-message-processor.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly handleFreeMessage: FreeMessageProcessorService,
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

    if (!From || !userMessage) {
      console.error('Missing From or Body in webhook payload:', body);
      return { success: false, error: 'Invalid payload' };
    }

    const telefoneFormatado = From.replace('whatsapp:', '')
      .replace('+55', '')
      .trim();

    if (!/^\d+$/.test(telefoneFormatado)) {
      console.error('Invalid phone number format:', telefoneFormatado);
      return { success: false, error: 'Invalid phone number' };
    }

    const session = this.getSession(telefoneFormatado);
    // Update session with phone number
    this.updateSession(telefoneFormatado, {
      ...session,
      telefone: telefoneFormatado,
    });

    await this.handleFreeMessage.processMessage(telefoneFormatado, userMessage);
    return { success: true };
  }
}
