import { Injectable } from '@nestjs/common';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';

@Injectable()
export class MenuPrincipalState implements ChatbotState {
  constructor(
    private readonly messageFormatter: MessageFormatterService,
    private readonly agendamentoService: AgendamentoService, // Adicione esta dependência
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    console.log('MenuPrincipalState - handle:', { telefone, userMessage });
    const session = controller.getSession(telefone);
    const mensagemLowerCase = userMessage.toLowerCase().trim();

    // Se não há nome, redireciona para solicitar_nome
    if (!session.nome) {
      session.etapa = 'solicitar_nome';
      await this.messageFormatter.formatAndSend(telefone, 'solicitar_nome', {
        mensagem: userMessage,
      });
      controller.updateSession(telefone, session);
      return;
    }

    // Tratamento de intenções que mudam o estado
    if (mensagemLowerCase.trim() === 'agendar') {
      try {
        // Buscar serviços aqui mesmo
        const servicos = await this.agendamentoService.listarServicos();

        // Preparar a sessão para o próximo estado
        session.etapa = 'selecionar_servico';
        session.servicos = servicos;

        // Formatar e enviar a lista
        const listaFormatada = servicos
          .map((s, index) => `${index + 1}. ${s.nome}`)
          .join('\n');

        await this.messageFormatter.formatAndSend(
          telefone,
          'menu_principal_agendar',
          {
            nome: session.nome,
            listaFormatada,
          },
        );

        controller.updateSession(telefone, session);
        return;
      } catch (error) {
        console.error('Erro ao listar serviços:', error);
        await this.messageFormatter.sendSystemUnavailableMessage(telefone);
        return;
      }
    } else {
      // Interação livre - apenas enviar a mensagem do usuário
      await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_livre',
        {
          nome: session.nome,
          mensagem: userMessage,
        },
      );
    }

    // Marca a saudação como enviada após a primeira interação
    if (!session.saudacaoEnviada) {
      session.saudacaoEnviada = true;
    }

    controller.updateSession(telefone, session);
  }
}
