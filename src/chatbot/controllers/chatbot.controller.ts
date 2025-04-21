import { Controller, Post, Body } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { StateFactory } from '../states/state.factory';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly stateFactory: StateFactory,
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
    console.log('ChatbotController - handleIncomingMessage:', {
      From,
      telefoneFormatado,
      userMessage,
    });

    const session = this.getSession(telefoneFormatado);
    console.log('ChatbotController - session:', session);

    const currentState = session.etapa || 'inicial';
    console.log('ChatbotController - currentState:', currentState);

    const stateHandler = this.stateFactory.getState(currentState);
    console.log(
      'ChatbotController - stateHandler:',
      stateHandler.constructor.name,
    );

    await stateHandler.handle(this, telefoneFormatado, userMessage);

    return { success: true };
  }
}
