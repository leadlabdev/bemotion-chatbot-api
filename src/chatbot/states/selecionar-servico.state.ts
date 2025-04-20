import { Injectable } from '@nestjs/common';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';

import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class SelecionarServicoState implements ChatbotState {
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
    const escolha = parseInt(userMessage.trim());

    if (isNaN(escolha) || escolha < 1 || escolha > session.servicos.length) {
      const listaFormatada = session.servicos
        .map((s, index) => `${index + 1}. ${s.nome}`)
        .join('\n');

      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_servico_invalido',
        {
          nome: session.nome,
          escolhaInvalida: userMessage,
          servicos: session.servicos,
          listaFormatada,
        },
      );
      return;
    }

    const servicoIndex = escolha - 1;
    session.servicoSelecionado = session.servicos[servicoIndex];
    session.etapa = 'selecionar_profissional';

    const profissionais = await this.agendamentoService.listarProfissionais();
    session.profissionais = profissionais;

    const listaFormatada = profissionais
      .map((p, index) => `${index + 1}. ${p.nome}`)
      .join('\n');

    await this.messageFormatter.formatAndSend(
      telefone,
      'selecionar_profissional',
      {
        nome: session.nome,
        servicoEscolhido: session.servicoSelecionado.nome,
        listaFormatada,
      },
    );

    controller.updateSession(telefone, session);
  }
}
