import { Controller, Post, Body } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { StateFactory } from '../states/state.factory';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly stateFactory: StateFactory,
  ) {}

  // Métodos de acesso à sessão
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
    console.log('Sessão atual recuperada:', session);

    const currentState = session.etapa || 'inicial';
    const stateHandler = this.stateFactory.getState(currentState);

    await stateHandler.handle(this, telefoneFormatado, userMessage);

    return { success: true };
  }
}
