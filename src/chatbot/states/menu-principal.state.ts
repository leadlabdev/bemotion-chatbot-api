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
    const session = controller.getSession(telefone);
    const mensagemLowerCase = userMessage.toLowerCase().trim();

    // Se não há nome, redireciona para solicitar_nome
    if (!session.nome) {
      session.etapa = 'solicitar_nome';
      await this.messageFormatter.formatAndSend(telefone, 'solicitar_nome', {});
      controller.updateSession(telefone, session);
      return;
    }

    // Tratamento de intenções específicas
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
        },
      );
    } else if (
      mensagemLowerCase.includes('horário') ||
      mensagemLowerCase.includes('disponível')
    ) {
      await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_horarios',
        {
          nome: session.nome,
        },
      );
    } else if (
      mensagemLowerCase.includes('pacote') ||
      mensagemLowerCase.includes('pacotes') ||
      mensagemLowerCase.includes('combo')
    ) {
      await this.messageFormatter.formatAndSend(telefone, 'ver_pacotes', {
        nome: session.nome,
      });
    } else if (
      mensagemLowerCase.includes('preço') ||
      mensagemLowerCase.includes('precos') ||
      mensagemLowerCase.includes('quanto custa')
    ) {
      await this.messageFormatter.formatAndSend(telefone, 'ver_precos', {
        nome: session.nome,
      });
    } else if (
      mensagemLowerCase.includes('serviço') ||
      mensagemLowerCase.includes('serviços') ||
      mensagemLowerCase.includes('o que tem')
    ) {
      await this.messageFormatter.formatAndSend(telefone, 'ver_servicos', {
        nome: session.nome,
      });
    } else {
      // Resposta genérica
      await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_generico',
        {
          nome: session.nome,
          mensagem: userMessage,
        },
      );
    }

    // Evita repetição da saudação padrão
    if (!session.saudacaoEnviada) {
      session.saudacaoEnviada = true;
    }

    controller.updateSession(telefone, session);
  }
}
