import { Injectable } from '@nestjs/common';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class MenuPrincipalState implements ChatbotState {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    console.log('MenuPrincipalState - handle:', { telefone, userMessage });
    const session = controller.getSession(telefone);
    const mensagemLowerCase = userMessage.toLowerCase().trim();

    // Se não há nome, redireciona para solicitar_nome
    if (!session.nome) {
      session.etapa = 'solicitar_nome';
      await this.messageFormatter.formatAndSend(telefone, 'solicitar_nome', {});
      controller.updateSession(telefone, session);
      return;
    }

    // Inicializa previousMessages se não existir
    if (!session.previousMessages) {
      session.previousMessages = [];
    }

    // Adiciona a mensagem do usuário ao histórico
    session.previousMessages.push(`Cliente: ${userMessage}`);

    // Tratamento de intenções que mudam o estado
    if (
      mensagemLowerCase.includes('agendar') ||
      mensagemLowerCase.includes('marcar')
    ) {
      session.etapa = 'selecionar_servico';
      await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_agendar',
        {
          nome: session.nome,
          mensagem: userMessage,
          previousMessages: session.previousMessages,
          saudacaoEnviada: session.saudacaoEnviada || false,
        },
      );
    } else {
      // Interação livre
      const context = {
        nome: session.nome,
        mensagem: userMessage,
        previousMessages: session.previousMessages,
        saudacaoEnviada: session.saudacaoEnviada || false,
      };
      const response = await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_livre',
        context,
      );

      // Adiciona a resposta ao histórico
      session.previousMessages.push(`Mari: ${response}`);
    }

    // Marca a saudação como enviada após a primeira interação
    if (!session.saudacaoEnviada) {
      session.saudacaoEnviada = true;
    }

    controller.updateSession(telefone, session);
  }
}
