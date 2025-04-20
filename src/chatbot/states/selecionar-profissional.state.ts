import { Injectable } from '@nestjs/common';
import { ChatbotState } from './chatbot-state.interface';
import { MessageFormatterService } from '../services/message-formatter.service';
import { ChatbotController } from '../controllers/chatbot.controller';

@Injectable()
export class SelecionarProfissionalState implements ChatbotState {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);
    const escolha = parseInt(userMessage.trim());

    if (
      isNaN(escolha) ||
      escolha < 1 ||
      escolha > session.profissionais.length
    ) {
      const listaFormatada = session.profissionais
        .map((p, index) => `${index + 1}. ${p.nome}`)
        .join('\n');

      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_profissional_invalido',
        {
          nome: session.nome,
          escolhaInvalida: userMessage,
          listaFormatada,
        },
      );
      return;
    }

    const profissionalIndex = escolha - 1;
    session.profissionalSelecionado = session.profissionais[profissionalIndex];
    session.etapa = 'selecionar_data';

    await this.messageFormatter.formatAndSend(telefone, 'selecionar_data', {
      nome: session.nome,
      servicoEscolhido: session.servicoSelecionado.nome,
      profissionalEscolhido: session.profissionalSelecionado.nome,
    });

    controller.updateSession(telefone, session);
  }
}
