import { Injectable } from '@nestjs/common';

import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class SelecionarHoraState implements ChatbotState {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);
    const horaRegex = /^(\d{1,2}):(\d{2})$/;
    const match = userMessage.match(horaRegex);

    if (!match) {
      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_hora_invalido',
        {
          nome: session.nome,
          horaInvalida: userMessage,
        },
      );
      return;
    }

    const hora = parseInt(match[1]);
    const minuto = parseInt(match[2]);

    if (
      hora < 9 ||
      hora >= 19 ||
      (hora === 18 && minuto > 30) ||
      minuto >= 60 ||
      minuto % 30 !== 0
    ) {
      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_hora_fora_horario',
        {
          nome: session.nome,
          horaInvalida: userMessage,
        },
      );
      return;
    }

    session.horaEscolhida = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
    const [dia, mes, ano] = session.dataFormatada.split('/');
    const dataHoraInicio = `${ano}-${mes}-${dia}T${session.horaEscolhida}:00`;
    session.dataHoraInicio = dataHoraInicio;
    session.etapa = 'confirmar_agendamento';

    let duracao = 60;
    let valor = 0;

    if (session.servicoSelecionado.nome.toUpperCase().includes('MANICURE')) {
      duracao = 45;
      valor = 45.0;
    } else if (
      session.servicoSelecionado.nome.toUpperCase().includes('CORTE')
    ) {
      duracao = 30;
      valor = 60.0;
    }

    session.duracao = duracao;
    session.valor = valor;

    await this.messageFormatter.formatAndSend(
      telefone,
      'confirmar_agendamento',
      {
        nome: session.nome,
        servicoEscolhido: session.servicoSelecionado.nome,
        profissionalEscolhido: session.profissionalSelecionado.nome,
        dataEscolhida: session.dataFormatada,
        horaEscolhida: session.horaEscolhida,
        duracao,
        valor: valor.toFixed(2),
      },
    );

    controller.updateSession(telefone, session);
  }
}
