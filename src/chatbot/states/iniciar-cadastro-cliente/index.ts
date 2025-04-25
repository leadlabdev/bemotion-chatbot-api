import { Injectable } from '@nestjs/common';
import { ChatbotState } from '../chatbot-state.interface';
import { SolicitarNomeState } from './solicitar-nome.state';
import { SolicitarSexoState } from './solicitar-sexo.state';
import { ChatbotController } from 'src/chatbot/controllers/chatbot.controller';

@Injectable()
export class IniciarCadastroCliente implements ChatbotState {
  constructor(
    private readonly solicitarNomeState: SolicitarNomeState,
    private readonly solicitarSexoState: SolicitarSexoState,
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    return await this.solicitarNomeState.handle(
      controller,
      telefone,
      userMessage,
    );
  }

  getChildState(etapa: string): ChatbotState {
    switch (etapa) {
      case 'solicitar_nome':
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
