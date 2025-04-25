import { Injectable } from '@nestjs/common';
import { ChatbotState } from '../chatbot-state.interface';
import { SelecionarServicoState } from './selecionar-servico.state';
import { SelecionarProfissionalState } from './selecionar-profissional.state';
import { SelecionarDataState } from './selecionar-data.state';
import { ConfirmarAgendamentoState } from './confirmar-agendamento.state';
import { MessageFormatterService } from 'src/chatbot/services/message-formatter.service';
import { ChatbotController } from 'src/chatbot/controllers/chatbot.controller';
import { SelecionarHoraState } from './selecionar-hora.state';

@Injectable()
export class IniciarAgendamento implements ChatbotState {
  constructor(
    private readonly messageFormatter: MessageFormatterService,
    private readonly selecionarServicoState: SelecionarServicoState,
    private readonly selecionarProfissionalState: SelecionarProfissionalState,
    private readonly selecionarDataState: SelecionarDataState,
    private readonly selecionarHoraState: SelecionarHoraState,
    private readonly confirmarAgendamentoState: ConfirmarAgendamentoState,
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    console.log('IniciarAgendamento - handle:', { telefone, userMessage });
    const session = controller.getSession(telefone);

    session.etapa = 'selecionar_servico';
    controller.updateSession(telefone, session);

    await this.messageFormatter.formatAndSend(telefone, 'selecionar_servico', {
      nome: session.nome,
    });
  }

  // Método para acessar os estados filhos
  getChildState(etapa: string): ChatbotState {
    switch (etapa) {
      case 'selecionar_servico':
        return this.selecionarServicoState;
      case 'selecionar_data':
        return this.selecionarDataState;
      case 'selecionar_hora':
        return this.selecionarHoraState;
      case 'selecionar_profissional':
        return this.selecionarProfissionalState;
      case 'confirmar_agendamento':
        return this.confirmarAgendamentoState;
      default:
        return this;
    }
  }
}

// Exportando todos os estados relacionados ao agendamento
export { SelecionarServicoState } from './selecionar-servico.state';
export { SelecionarProfissionalState } from './selecionar-profissional.state';
export { SelecionarDataState } from './selecionar-data.state';
export { SelecionarHoraState } from './selecionar-hora.state';
export { ConfirmarAgendamentoState } from './confirmar-agendamento.state';
