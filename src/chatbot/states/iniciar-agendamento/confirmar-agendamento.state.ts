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
        // Combine data e hora no formato esperado pela API (ex: YYYY-MM-DDTHH:MM:SS)
        const dataHoraInicio = this.formatarDataHora(
          session.dataSelecionada,
          session.horarioEscolhido,
        );

        // Chamando o serviço para criar o agendamento com o datetime correto
        await this.agendamentoService.criarAgendamento(
          session.servicoSelecionado.id,
          session.clienteId,
          session.profissionalSelecionado.id,
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
        console.error('Erro ao criar agendamento:', error);
        session.etapa = 'erro';
        await this.messageFormatter.formatAndSend(
          telefone,
          'confirmar_agendamento_erro',
          { nome: session.nome },
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
      // Permanece no estado 'confirmar_agendamento' esperando uma resposta válida
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
    // Assumindo que data está no formato DD/MM/AAAA e hora no formato HH:MM
    const [dia, mes, ano] = data.split('/');
    const [horas, minutos] = hora.split(':');

    // Formato esperado pela API (pode variar, ajuste conforme a documentação)
    return `${ano}-${mes}-${dia}T${horas}:${minutos}:00`; // Exemplo: 2025-05-15T09:00:00
  }
}
