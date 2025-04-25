import { Injectable } from '@nestjs/common';
import { ChatbotState } from './chatbot-state.interface';
import { InitialState } from './initial.state';
import { ErrorState } from './error.state';
import { MenuPrincipalState } from './menu-principal.state';
import { IniciarCadastroCliente } from './iniciar-cadastro-cliente';
import { IniciarAgendamento } from './iniciar-agendamento';

@Injectable()
export class StateFactory {
  constructor(
    private readonly initialState: InitialState,
    private readonly iniciarCadastroClienteState: IniciarCadastroCliente,
    private readonly menuPrincipalState: MenuPrincipalState,
    private readonly iniciarAgendamento: IniciarAgendamento,
    private readonly errorState: ErrorState,
  ) {}

  getState(etapa: string): ChatbotState {
    console.log('StateFactory - getState:', etapa);
    switch (etapa) {
      case 'inicial':
        return this.initialState;
      case 'iniciar_cadastro_cliente':
        return this.iniciarCadastroClienteState;
      case 'solicitar_nome':
      case 'solicitar_sexo':
        return this.iniciarCadastroClienteState.getChildState(etapa);
      case 'menu_principal':
        return this.menuPrincipalState;
      case 'iniciar_agendamento':
        return this.iniciarAgendamento;
      case 'selecionar_servico':
      case 'selecionar_profissional':
      case 'selecionar_data':
      case 'selecionar_hora':
      case 'confirmar_agendamento':
        return this.iniciarAgendamento.getChildState(etapa);
      case 'erro':
        return this.errorState;
      default:
        console.warn(`Estado desconhecido: ${etapa}. Retornando InitialState.`);
        return this.initialState;
    }
  }
}
