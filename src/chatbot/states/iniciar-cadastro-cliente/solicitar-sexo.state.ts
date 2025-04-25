import { Injectable } from '@nestjs/common';
import { TrinksService } from 'src/trinks/trinks.service';
import { ChatbotState } from '../chatbot-state.interface';
import { MessageFormatterService } from 'src/chatbot/services/message-formatter.service';
import { ChatbotController } from 'src/chatbot/controllers/chatbot.controller';

@Injectable()
export class SolicitarSexoState implements ChatbotState {
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

    if (!['M', 'F'].includes(userMessage.toUpperCase())) {
      await this.messageFormatter.formatAndSend(
        telefone,
        'solicitar_sexo_invalido',
        {
          nome: session.nome,
          escolhaInvalida: userMessage,
        },
      );
      return;
    }

    session.sexo = userMessage.toUpperCase();

    try {
      const novoCliente = await this.trinksService.createCliente(
        session.nome,
        session.sexo,
        {
          ddd: telefone.substring(0, 2),
          numero: telefone.substring(2),
          tipoId: 1,
        },
      );

      session.clienteId = novoCliente.id;
      session.etapa = 'menu_principal';

      await this.messageFormatter.formatAndSend(
        telefone,
        'cadastrar_cliente_sucesso',
        { nome: session.nome },
      );
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      session.etapa = 'erro';
      await this.messageFormatter.formatAndSend(
        telefone,
        'cadastrar_cliente_erro',
        { nome: session.nome },
      );
    }

    controller.updateSession(telefone, session);
  }
}
