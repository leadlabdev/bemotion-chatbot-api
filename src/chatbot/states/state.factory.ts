import { Injectable } from '@nestjs/common';
import { ChatbotState } from './chatbot-state.interface';
import { InitialState } from './initial.state';
import { SolicitarNomeState } from './solicitar-nome.state';
import { ConfirmarAgendamentoState } from './confirmar-agendamento.state';
import { ErroState } from './erro.state';
import { SelecionarHoraState } from './selecionar-hora.state';
import { SelecionarDataState } from './selecionar-data.state';
import { SelecionarProfissionalState } from './selecionar-profissional.state';
import { SolicitarSexoState } from './solicitar-sexo.state';
import { MenuPrincipalState } from './menu-principal.state';
import { SelecionarServicoState } from './selecionar-servico.state';

@Injectable()
export class StateFactory {
  constructor(
    private readonly initialState: InitialState,
    private readonly solicitarNomeState: SolicitarNomeState,
    private readonly solicitarSexoState: SolicitarSexoState,
    private readonly menuPrincipalState: MenuPrincipalState,
    private readonly selecionarServicoState: SelecionarServicoState,
    private readonly selecionarProfissionalState: SelecionarProfissionalState,
    private readonly selecionarDataState: SelecionarDataState,
    private readonly selecionarHoraState: SelecionarHoraState,
    private readonly confirmarAgendamentoState: ConfirmarAgendamentoState,
    private readonly erroState: ErroState,
  ) {}

  getState(etapa: string): ChatbotState {
    switch (etapa) {
      case 'inicial':
        return this.initialState;
      case 'solicitar_nome':
        return this.solicitarNomeState;
      case 'solicitar_sexo':
        return this.solicitarSexoState;
      case 'menu_principal':
        return this.menuPrincipalState;
      case 'selecionar_servico':
        return this.selecionarServicoState;
      case 'selecionar_profissional':
        return this.selecionarProfissionalState;
      case 'selecionar_data':
        return this.selecionarDataState;
      case 'selecionar_hora':
        return this.selecionarHoraState;
      case 'confirmar_agendamento':
        return this.confirmarAgendamentoState;
      case 'erro':
        return this.erroState;
      default:
        return this.initialState;
    }
  }
}
