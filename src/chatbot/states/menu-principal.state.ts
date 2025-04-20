import { Injectable } from '@nestjs/common';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class MenuPrincipalState implements ChatbotState {
  constructor(
    private readonly agendamentoService: AgendamentoService,
    private readonly messageFormatter: MessageFormatterService,
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    const session = controller.getSession(telefone);
    const mensagemLowerCase = userMessage.toLowerCase();

    if (
      mensagemLowerCase.includes('agendar') ||
      mensagemLowerCase.includes('marcar')
    ) {
      const servicos = await this.agendamentoService.listarServicos();
      session.servicos = servicos;
      session.etapa = 'selecionar_servico';

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
    } else if (
      mensagemLowerCase.includes('horário') ||
      mensagemLowerCase.includes('disponível')
    ) {
      await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_horarios',
        { nome: session.nome },
      );
    } else {
      await this.messageFormatter.formatAndSend(
        telefone,
        'menu_principal_generico',
        {
          nome: session.nome,
          mensagem: userMessage,
        },
      );
    }

    controller.updateSession(telefone, session);
  }
}
