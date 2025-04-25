import { Injectable } from '@nestjs/common';
import { ChatbotState } from '../chatbot-state.interface';
import { MessageFormatterService } from 'src/chatbot/services/message-formatter.service';
import { ChatbotController } from 'src/chatbot/controllers/chatbot.controller';

@Injectable()
export class SolicitarNomeState implements ChatbotState {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);

    if (!session.nome) {
      const mensagemNormalizada = userMessage
        .trim()
        .toLowerCase()
        .replace(
          /meu nome é|meu nome|me chamo|é|oi|ola|olá|bom dia|boa tarde|boa noite/gi,
          '',
        )
        .trim();

      const primeiroNome = mensagemNormalizada.split(/\s+/)[0];

      if (
        !primeiroNome ||
        primeiroNome.length < 2 ||
        ['meu', 'nome', 'é', 'sou', 'me', 'chamo'].includes(
          primeiroNome.toLowerCase(),
        )
      ) {
        await this.messageFormatter.formatAndSend(
          telefone,
          'nome_invalido',
          {},
        );
        return;
      }

      session.nome =
        primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
      session.subEtapa = 'aguardando_sobrenome';

      await this.messageFormatter.formatAndSend(
        telefone,
        'solicitar_sobrenome',
        {
          nome: session.nome,
        },
      );

      controller.updateSession(telefone, session);
      return;
    }

    if (session.subEtapa === 'aguardando_sobrenome') {
      const sobrenome = userMessage
        .trim()
        .replace(/meu sobrenome é|sobrenome|é/gi, '')
        .trim();

      if (sobrenome.length < 2 || sobrenome.includes(' ')) {
        await this.messageFormatter.formatAndSend(
          telefone,
          'sobrenome_invalido',
          {
            nome: session.nome,
          },
        );
        return;
      }

      session.nome = `${session.nome} ${sobrenome.charAt(0).toUpperCase() + sobrenome.slice(1)}`;
      session.etapa = 'solicitar_sexo';
      delete session.subEtapa;

      await this.messageFormatter.formatAndSend(telefone, 'solicitar_sexo', {
        nome: session.nome,
      });

      controller.updateSession(telefone, session);
    }
  }
}
