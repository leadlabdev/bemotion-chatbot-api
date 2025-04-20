import { Injectable } from '@nestjs/common';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class ErroState implements ChatbotState {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);

    session.etapa = 'menu_principal';

    await this.messageFormatter.formatAndSend(telefone, 'erro', {
      nome: session.nome,
    });

    controller.updateSession(telefone, session);
  }
}
