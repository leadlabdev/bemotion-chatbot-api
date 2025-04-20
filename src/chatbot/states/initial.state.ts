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
    const session = controller.getSession(telefone);

    const clientes =
      await this.trinksService.identificarClientePorTelefone(telefone);

    if (clientes.length === 0) {
      session.etapa = 'solicitar_nome';
      await this.messageFormatter.formatAndSend(telefone, 'solicitar_nome');
    } else {
      const cliente = clientes[0];
      session.clienteId = cliente.id;
      session.nome = cliente.nome;
      session.etapa = 'menu_principal';
      await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_boas_vindas',
        { nome: cliente.nome },
      );
    }

    controller.updateSession(telefone, session);
  }
}
