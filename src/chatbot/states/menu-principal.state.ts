import { Injectable } from '@nestjs/common';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';
import { TrinksService } from 'src/trinks/trinks.service';
import { MensagemLivreService } from '../services/message-livre.service';

@Injectable()
export class MenuPrincipalState implements ChatbotState {
  constructor(
    private readonly messageFormatter: MessageFormatterService,
    private readonly messageLivre: MensagemLivreService,
    private readonly trinksService: TrinksService,
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    console.log('MenuPrincipalState - handle:', { telefone, userMessage });
    const session = controller.getSession(telefone);
    const mensagemLowerCase = userMessage.toLowerCase().trim();

    // Se não há nome, redireciona para iniciar_cadasto_cliente
    if (!session.nome) {
      session.etapa = 'iniciar_cadastro_cliente';
      await this.messageFormatter.formatAndSend(
        telefone,
        'iniciar_cadastro_cliente',
        { mensagem: userMessage },
      );
      controller.updateSession(telefone, session);
      return;
    }

    // Tratamento de intenções que mudam o estado
    if (mensagemLowerCase === 'agendar') {
      try {
        const servicos = await this.trinksService.listarServicos();
        if (!servicos || servicos.length === 0) {
          console.error('Nenhum serviço retornado pela API.');
          await this.messageFormatter.sendSystemUnavailableMessage(telefone);
          return;
        }

        session.servicos = servicos;
        session.etapa = 'selecionar_servico';

        const listaFormatada = servicos
          .map((s, index) => `${index + 1}. ${s.nome}`)
          .join('\n');

        await this.messageFormatter.formatAndSend(
          telefone,
          'selecionar_servico',
          { nome: session.nome, listaFormatada },
        );

        controller.updateSession(telefone, session);
      } catch (error) {
        console.error('Erro ao listar serviços:', error);
        await this.messageFormatter.sendSystemUnavailableMessage(telefone);
      }
    } else {
      // Interação livre - enviar a mensagem do usuário para o GPT
      await this.messageLivre.handleFreeFormMessage(
        telefone,
        userMessage, // Enviar diretamente a mensagem do usuário como primeiro parâmetro
        session.nome, // Enviar o nome como segundo parâmetro
      );
    }

    // Marca a saudação como enviada após a primeira interação
    if (!session.saudacaoEnviada) {
      session.saudacaoEnviada = true;
    }

    controller.updateSession(telefone, session);
  }
}
