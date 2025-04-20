import { Injectable } from '@nestjs/common';

import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class SelecionarDataState implements ChatbotState {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);
    const dataRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = userMessage.match(dataRegex);

    if (!match) {
      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_data_invalido',
        {
          nome: session.nome,
          dataInvalida: userMessage,
        },
      );
      return;
    }

    const dia = parseInt(match[1]);
    const mes = parseInt(match[2]) - 1;
    const ano = parseInt(match[3]);
    const dataEscolhida = new Date(ano, mes, dia);
    const hoje = new Date();

    if (dataEscolhida < hoje) {
      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_data_passado',
        {
          nome: session.nome,
          dataInvalida: userMessage,
        },
      );
      return;
    }

    session.dataEscolhida = dataEscolhida;
    session.dataFormatada = userMessage;
    session.etapa = 'selecionar_hora';

    await this.messageFormatter.formatAndSend(telefone, 'selecionar_hora', {
      nome: session.nome,
      servicoEscolhido: session.servicoSelecionado.nome,
      profissionalEscolhido: session.profissionalSelecionado.nome,
      dataEscolhida: userMessage,
    });

    controller.updateSession(telefone, session);
  }
}
