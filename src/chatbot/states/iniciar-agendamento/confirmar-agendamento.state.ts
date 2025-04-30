import { Injectable } from '@nestjs/common';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';
import { ChatbotState } from '../chatbot-state.interface';
import { MessageFormatterService } from 'src/chatbot/services/message-formatter.service';
import { ChatbotController } from 'src/chatbot/controllers/chatbot.controller';

@Injectable()
export class ConfirmarAgendamentoState implements ChatbotState {
  constructor(
    private readonly agendamentoService: AgendamentoService,
    private readonly messageFormatter: MessageFormatterService,
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);
    const resposta = userMessage.toLowerCase().trim();

    if (resposta === 'confirmar') {
      try {
        // Combine data e hora no formato esperado pela API
        const dataHoraInicio = this.formatarDataHora(
          session.dataSelecionada,
          session.horarioEscolhido,
        );

        // Logar parâmetros para depuração
        console.log('Tentando criar agendamento com:', {
          clienteId: session.clienteId,
          servicoId: session.servicoSelecionado.id,
          profissionalId: session.profissionalSelecionado.id,
          dataHoraInicio,
          duracaoEmMinutos: session.servicoSelecionado.duracaoEmMinutos,
          valor: session.servicoSelecionado.preco,
          observacoes: 'Agendamento via lead',
        });

        // Criar o agendamento com parâmetros corrigidos
        await this.agendamentoService.criarAgendamento(
          session.clienteId, // Corrigido: 71378567
          session.servicoSelecionado.id, // Corrigido: 13038108
          session.profissionalSelecionado.id, // 702154
          dataHoraInicio,
          session.servicoSelecionado.duracaoEmMinutos,
          session.servicoSelecionado.preco,
          'Agendamento via lead',
        );

        session.etapa = 'menu_principal';

        await this.messageFormatter.formatAndSend(
          telefone,
          'confirmar_agendamento_sucesso',
          {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: session.dataSelecionada,
            horarioEscolhido: session.horarioEscolhido,
            duracao: session.servicoSelecionado.duracaoEmMinutos,
            valor: session.servicoSelecionado.preco.toFixed(2),
          },
        );
      } catch (error) {
        // Logar detalhes do erro
        console.error('Erro ao confirmar agendamento:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        // Extrair erros específicos da API Trinks
        let erroDetalhado =
          'Ocorreu um erro ao tentar confirmar o agendamento.';
        if (
          error.response?.data?.Errors &&
          Array.isArray(error.response.data.Errors)
        ) {
          const erros = error.response.data.Errors.map(
            (err: { PropertyName: string; ErrorMessage: string }) =>
              `Erro em ${err.PropertyName || 'geral'}: ${err.ErrorMessage}`,
          ).join('; ');
          erroDetalhado = `Erro ao confirmar: ${erros}`;
          console.error('Erros da API Trinks:', erros);
        } else {
          console.error('Nenhum erro específico da API Trinks encontrado.');
        }

        session.etapa = 'erro';
        await this.messageFormatter.formatAndSend(
          telefone,
          'confirmar_agendamento_erro',
          {
            nome: session.nome,
            erroDetalhado,
          },
        );
      }
    } else if (resposta === 'cancelar') {
      session.etapa = 'menu_principal';
      await this.messageFormatter.formatAndSend(
        telefone,
        'confirmar_agendamento_cancelar',
        { nome: session.nome },
      );
    } else {
      await this.messageFormatter.formatAndSend(
        telefone,
        'confirmar_agendamento_invalido',
        {
          nome: session.nome,
          escolhaInvalida: userMessage,
        },
      );
    }

    controller.updateSession(telefone, session);
  }

  async onEnter(
    controller: ChatbotController,
    telefone: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);
    await this.messageFormatter.formatAndSend(
      telefone,
      'exibir_confirmacao_agendamento',
      {
        nome: session.nome,
        servicoEscolhido: session.servicoSelecionado.nome,
        profissionalEscolhido: session.profissionalSelecionado.nome,
        dataEscolhida: session.dataSelecionada,
        horarioEscolhido: session.horarioEscolhido,
      },
    );
  }

  private formatarDataHora(data: string, hora: string): string {
    const [dia, mes, ano] = data.split('/');
    const [horas, minutos] = hora.split(':');
    return `${ano}-${mes}-${dia}T${horas}:${minutos}:00`;
  }
}
