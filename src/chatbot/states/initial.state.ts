import { Injectable } from '@nestjs/common';
import { TrinksService } from 'src/trinks/trinks.service';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class InitialState implements ChatbotState {
  constructor(
    private readonly trinksService: TrinksService,
    private readonly messageFormatter: MessageFormatterService,
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    console.log('InitialState - handle:', { telefone, userMessage });

    const session = controller.getSession(telefone) || {};

    const result =
      await this.trinksService.identificarClientePorTelefone(telefone);

    if (!result.success) {
      await this.handleError(session, controller, telefone, result);
      return;
    }

    const clientes = result.clientes;

    if (clientes?.length === 0) {
      await this.handleNewClient(session, controller, telefone, userMessage);
    } else if (clientes?.length > 0) {
      await this.handleExistingClient(
        session,
        controller,
        telefone,
        clientes[0],
      );
    } else {
      await this.handleUnexpectedError(session, controller, telefone);
    }

    session.saudacaoEnviada = true;
    controller.updateSession(telefone, session);
  }

  private async handleError(
    session: any,
    controller: ChatbotController,
    telefone: string,
    result: any,
  ): Promise<void> {
    session.etapa = 'erro';
    session.error = result.error;
    session.errorMessage = result.message;

    await this.messageFormatter.sendSystemUnavailableMessage(telefone);
    controller.updateSession(telefone, session);
  }

  private async handleNewClient(
    session: any,
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    session.etapa = 'solicitar_nome';

    await this.messageFormatter.formatAndSend(telefone, 'solicitar_nome', {
      mensagem: userMessage,
      isFirstMessage: true,
    });
    controller.updateSession(telefone, session);
  }

  private async handleExistingClient(
    session: any,
    controller: ChatbotController,
    telefone: string,
    cliente: any,
  ): Promise<void> {
    session.clienteId = cliente.id;
    session.nome = cliente.nome;
    session.etapa = 'menu_principal';

    await this.messageFormatter.formatAndSend(
      telefone,
      'menu_principal_boas_vindas',
      {
        nome: cliente.nome,
        isFirstMessage: true,
      },
    );
    controller.updateSession(telefone, session);
  }

  private async handleUnexpectedError(
    session: any,
    controller: ChatbotController,
    telefone: string,
  ): Promise<void> {
    session.etapa = 'erro';

    await this.messageFormatter.formatAndSend(
      telefone,
      'sistema_indisponivel',
      {
        mensagem:
          'Desculpe, ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
      },
    );
    controller.updateSession(telefone, session);
  }
}
