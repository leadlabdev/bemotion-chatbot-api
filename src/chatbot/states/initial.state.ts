import { Injectable } from '@nestjs/common';
import { TrinksService } from 'src/trinks/trinks.service';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

interface ChatbotContext {
  conversationStage: string;
  previousMessages: string[];
  nome?: string;
}

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
    const clientes =
      await this.trinksService.identificarClientePorTelefone(telefone);

    const context: ChatbotContext = {
      conversationStage:
        clientes.length === 0
          ? 'saudação inicial'
          : 'pergunta sobre procedimento',
      previousMessages: [`Cliente: ${userMessage}`],
    };

    let response: string;
    if (clientes.length === 0) {
      session.etapa = 'solicitar_nome';
      response = await this.messageFormatter.formatAndSend(
        telefone,
        'solicitar_nome',
        context,
      );
    } else {
      const cliente = clientes[0];
      session.clienteId = cliente.id;
      session.nome = cliente.nome;
      session.etapa = 'menu_principal';
      context.nome = cliente.nome;
      response = await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_boas_vindas',
        context,
      );
    }

    context.previousMessages.push(`Mari: ${response}`);
    session.previousMessages = context.previousMessages;
    controller.updateSession(telefone, session);
  }
}
