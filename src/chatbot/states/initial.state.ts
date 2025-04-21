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
    const clientes =
      await this.trinksService.identificarClientePorTelefone(telefone);

    let response: string;

    if (clientes.length === 0) {
      // Cliente não encontrado, solicitar nome
      session.etapa = 'solicitar_nome';
      response = await this.messageFormatter.formatAndSend(
        telefone,
        'solicitar_nome',
        { mensagem: userMessage, isFirstMessage: true },
      );
    } else {
      // Cliente encontrado, ir para menu principal
      const cliente = clientes[0];
      session.clienteId = cliente.id;
      session.nome = cliente.nome;
      session.etapa = 'menu_principal';

      response = await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_boas_vindas',
        { nome: cliente.nome, isFirstMessage: true },
      );
    }

    // Atualizamos a sessão com informações mínimas necessárias
    session.saudacaoEnviada = true;
    controller.updateSession(telefone, session);
  }
}
