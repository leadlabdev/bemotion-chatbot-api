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

    // Handle the initial name collection
    if (session.subEtapa === 'solicitar_nome') {
      const mensagemNormalizada = userMessage
        .trim()
        .toLowerCase()
        .replace(
          /meu nome é|meu nome|me chamo|é|oi|ola|olá|bom dia|boa tarde|boa noite/gi,
          '',
        )
        .trim();

      const primeiroNome = mensagemNormalizada.split(/\s+/)[0];

      if (!this.validateName(primeiroNome)) {
        await this.messageFormatter.formatAndSend(
          telefone,
          'nome_invalido',
          {},
        );
        return;
      }

      session.nomeTentativo =
        primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1);
      session.subEtapa = 'confirmar_nome';

      await this.messageFormatter.formatAndSend(telefone, 'confirmar_nome', {
        nome: session.nomeTentativo,
      });

      controller.updateSession(telefone, session);
      return;
    }

    // Handle name confirmation
    if (session.subEtapa === 'confirmar_nome') {
      const resposta = userMessage.toLowerCase().trim();

      if (resposta === 'confirmar') {
        session.nome = session.nomeTentativo;
        session.subEtapa = 'aguardando_sobrenome';
        delete session.nomeTentativo;

        await this.messageFormatter.formatAndSend(
          telefone,
          'solicitar_sobrenome',
          {
            nome: session.nome,
          },
        );
      } else if (resposta === 'corrigir') {
        session.subEtapa = 'solicitar_nome';
        delete session.nomeTentativo;

        await this.messageFormatter.formatAndSend(
          telefone,
          'solicitar_nome',
          {},
        );
      } else {
        await this.messageFormatter.formatAndSend(
          telefone,
          'confirmacao_nome_invalida',
          {
            nome: session.nomeTentativo,
          },
        );
      }

      controller.updateSession(telefone, session);
      return;
    }

    // Handle surname collection
    if (session.subEtapa === 'aguardando_sobrenome') {
      const sobrenome = userMessage
        .trim()
        .toLowerCase()
        .replace(/meu sobrenome é|sobrenome|é/gi, '')
        .trim();

      if (!this.validateName(sobrenome)) {
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
      return;
    }
  }

  private validateName(name: string): boolean {
    const nameRegex = /^[A-Za-zÀ-ÿ]{2,}$/;
    return nameRegex.test(name);
  }
}
