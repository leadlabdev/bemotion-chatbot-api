import { Injectable } from '@nestjs/common';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

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
      console.log(
        '**********',
        session.clienteId,
        session.servicoSelecionado.id,
        session.profissionalSelecionado.id,
        session.dataHoraInicio,
        session.duracao,
        session.valor,
      );
      try {
        await this.agendamentoService.criarAgendamento(
          session.clienteId,
          session.servicoSelecionado.id,
          session.profissionalSelecionado.id,
          session.dataHoraInicio,
          session.duracao,
          session.valor,
          'Agendamento via WhatsApp',
        );

        session.etapa = 'menu_principal';

        await this.messageFormatter.formatAndSend(
          telefone,
          'confirmar_agendamento_sucesso',
          {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: session.dataFormatada,
            horaEscolhida: session.horaEscolhida,
            duracao: session.duracao,
            valor: session.valor.toFixed(2),
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
          respostaInvalida: userMessage,
        },
      );
    }

    controller.updateSession(telefone, session);
  }
}
