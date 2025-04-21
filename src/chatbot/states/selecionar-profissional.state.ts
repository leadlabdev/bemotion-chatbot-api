import { Injectable } from '@nestjs/common';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class SelecionarProfissionalState implements ChatbotState {
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

    // Carregar profissionais se ainda não estiverem na sessão
    if (!session.profissionais) {
      try {
        const profissionais =
          await this.agendamentoService.listarProfissionais();
        if (!profissionais || profissionais.length === 0) {
          await this.messageFormatter.formatAndSend(
            telefone,
            'erro_buscar_profissionais',
            { nome: session.nome },
          );
          session.etapa = 'selecionar_servico';
          controller.updateSession(telefone, session);
          return;
        }
        session.profissionais = profissionais;
        controller.updateSession(telefone, session);

        const listaFormatada = profissionais
          .map((p, index) => `${index + 1}. ${p.nome}`)
          .join('\n');

        await this.messageFormatter.formatAndSend(
          telefone,
          'selecionar_profissional',
          {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            listaFormatada,
          },
        );
        return;
      } catch (error) {
        console.error('Erro ao buscar profissionais:', error);
        await this.messageFormatter.formatAndSend(telefone, 'erro_sistema', {
          nome: session.nome,
        });
        session.etapa = 'selecionar_servico';
        controller.updateSession(telefone, session);
        return;
      }
    }

    // Validar escolha do profissional
    const escolha = parseInt(userMessage.trim());
    const profissionalIndex = escolha - 1;

    if (
      !isNaN(escolha) &&
      profissionalIndex >= 0 &&
      profissionalIndex < session.profissionais.length
    ) {
      session.profissionalSelecionado =
        session.profissionais[profissionalIndex];
      session.etapa = 'selecionar_data';
      controller.updateSession(telefone, session);

      await this.messageFormatter.formatAndSend(telefone, 'selecionar_data', {
        nome: session.nome,
        servicoEscolhido: session.servicoSelecionado.nome,
        profissionalEscolhido: session.profissionalSelecionado.nome,
      });
      return;
    }

    // Escolha inválida
    const listaFormatada = session.profissionais
      .map((p, index) => `${index + 1}. ${p.nome}`)
      .join('\n');

    await this.messageFormatter.formatAndSend(
      telefone,
      'selecionar_profissional_invalido',
      {
        nome: session.nome,
        escolhaInvalida: userMessage,
        listaFormatada,
      },
    );
    controller.updateSession(telefone, session);
  }
}
