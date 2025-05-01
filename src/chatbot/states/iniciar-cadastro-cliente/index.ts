import { Injectable } from '@nestjs/common';
import { ChatbotState } from '../chatbot-state.interface';
import { SolicitarNomeState } from './solicitar-nome.state';
import { SolicitarSexoState } from './solicitar-sexo.state';
import { ChatbotController } from 'src/chatbot/controllers/chatbot.controller';
import { MessageFormatterService } from 'src/chatbot/services/message-formatter.service';

@Injectable()
export class IniciarCadastroCliente implements ChatbotState {
  constructor(
    private readonly solicitarNomeState: SolicitarNomeState,
    private readonly solicitarSexoState: SolicitarSexoState,
    private readonly messageFormatter: MessageFormatterService,
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);

    if (session.subEtapa === 'aguardando_inicio_cadastro') {
      session.subEtapa = 'solicitar_nome';
      await this.messageFormatter.formatAndSend(telefone, 'solicitar_nome', {});
      controller.updateSession(telefone, session);
      return;
    }

    // Delegar para o estado apropriado com base na subEtapa
    const childState = this.getChildState(session.subEtapa || 'solicitar_nome');
    await childState.handle(controller, telefone, userMessage);
  }

  getChildState(etapa: string): ChatbotState {
    switch (etapa) {
      case 'solicitar_nome':
      case 'confirmar_nome':
      case 'aguardando_sobrenome':
        return this.solicitarNomeState;
      case 'solicitar_sexo':
        return this.solicitarSexoState;
      default:
        return this;
    }
  }
}

export { SolicitarNomeState } from './solicitar-nome.state';
export { SolicitarSexoState } from './solicitar-sexo.state';
