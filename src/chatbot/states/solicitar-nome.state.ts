import { Injectable } from '@nestjs/common';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

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
      const primeiroNome = userMessage.trim().split(/\s+/)[0];

      if (primeiroNome.length < 2) {
        await this.messageFormatter.formatAndSend(
          telefone,
          'nome_invalido',
          {},
        );
        return;
      }

      session.nome = primeiroNome;
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
      const sobrenome = userMessage.trim();

      if (sobrenome.length < 2 || sobrenome.includes(' ')) {
        await this.messageFormatter.formatAndSend(
          telefone,
          'sobrenome_invalido',
          {},
        );
        return;
      }

      session.nome = `${session.nome} ${sobrenome}`;
      session.etapa = 'solicitar_sexo';
      delete session.subEtapa;

      await this.messageFormatter.formatAndSend(telefone, 'solicitar_sexo', {
        nome: session.nome,
      });

      controller.updateSession(telefone, session);
    }
  }
}
