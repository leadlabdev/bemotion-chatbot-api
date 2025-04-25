import { Injectable } from '@nestjs/common';
import { ChatbotState } from '../chatbot-state.interface';
import { MessageFormatterService } from '../../services/message-formatter.service';
import { ChatbotController } from '../../controllers/chatbot.controller';

@Injectable()
export class SelecionarProfissionalState implements ChatbotState {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    console.log('SelecionarProfissionalState - handle:', {
      telefone,
      userMessage,
    });
    const session = controller.getSession(telefone);
    const escolha = parseInt(userMessage.trim()) - 1;

    console.log(
      'Escolha do usuário:',
      escolha + 1,
      'Total de profissionais:',
      session.profissionais.length,
    );

    if (
      isNaN(escolha) ||
      escolha < 0 ||
      escolha >= session.profissionais.length
    ) {
      const listaFormatada = session.profissionais
        .map((p, index) => `${index + 1}. ${p.nome}`)
        .join('\n');
      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_profissional',
        {
          nome: session.nome,
          servicoEscolhido: session.servicoSelecionado.nome,
          listaFormatada,
          escolhaInvalida: userMessage,
        },
      );
      return;
    }

    session.profissionalSelecionado = session.profissionais[escolha];
    session.etapa = 'selecionar_data'; // Transiciona para o novo estado

    await this.messageFormatter.formatAndSend(telefone, 'selecionar_data', {
      nome: session.nome,
      servicoEscolhido: session.servicoSelecionado.nome,
      profissionalEscolhido: session.profissionalSelecionado.nome,
    });

    controller.updateSession(telefone, session);
  }
}
