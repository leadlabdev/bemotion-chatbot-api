import { Injectable } from '@nestjs/common';
import { TrinksService } from 'src/trinks/trinks.service';
import { MessageFormatterService } from 'src/chatbot/services/message-formatter.service';
import { ChatbotState } from '../chatbot-state.interface';
import { ChatbotController } from 'src/chatbot/controllers/chatbot.controller';

@Injectable()
export class SelecionarServicoState implements ChatbotState {
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
    console.log('SelecionarServicoState - handle:', {
      telefone,
      userMessage,
      session,
    });

    // Verificar se há serviços na sessão
    if (!session.servicos || session.servicos.length === 0) {
      try {
        const servicos = await this.trinksService.listarServicos();
        if (!servicos || servicos.length === 0) {
          console.error('Nenhum serviço retornado pela API.');
          await this.messageFormatter.sendSystemUnavailableMessage(telefone);
          return;
        }

        session.servicos = servicos;
        const listaFormatada = servicos
          .map((s, index) => `${index + 1}. ${s.nome}`)
          .join('\n');

        await this.messageFormatter.formatAndSend(
          telefone,
          'selecionar_servico',
          {
            nome: session.nome,
            listaFormatada,
          },
        );

        controller.updateSession(telefone, {
          ...session,
          etapa: 'selecionar_servico',
          servicos,
        });
        return;
      } catch (error) {
        console.error('Erro ao listar serviços:', error);
        await this.messageFormatter.sendSystemUnavailableMessage(telefone);
        return;
      }
    }

    // Processar escolha do serviço
    const escolha = parseInt(userMessage.trim()) - 1;
    console.log(
      `Escolha do usuário: ${escolha + 1} Total de serviços: ${session.servicos.length}`,
    );

    if (isNaN(escolha) || escolha < 0 || escolha >= session.servicos.length) {
      const listaFormatada = session.servicos
        .map((s, index) => `${index + 1}. ${s.nome}`)
        .join('\n');

      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_servico_invalido',
        {
          nome: session.nome,
          escolhaInvalida: userMessage,
          listaFormatada,
        },
      );
      return;
    }

    // Selecionar o serviço
    const servicoSelecionado = session.servicos[escolha];

    // Buscar profissionais
    try {
      const profissionais = await this.trinksService.listarProfissionais();
      if (!profissionais || profissionais.length === 0) {
        await this.messageFormatter.formatAndSend(
          telefone,
          'sem_profissionais_disponiveis',
          {
            nome: session.nome,
            servicoEscolhido: servicoSelecionado.nome,
          },
        );
        return;
      }

      const listaFormatada = profissionais
        .map((p, index) => `${index + 1}. ${p.nome}`)
        .join('\n');

      // Atualizar sessão
      controller.updateSession(telefone, {
        ...session,
        etapa: 'selecionar_profissional',
        servicoSelecionado,
        profissionais,
      });

      // Enviar lista de profissionais
      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_profissional',
        {
          nome: session.nome,
          servicoEscolhido: servicoSelecionado.nome,
          listaFormatada,
        },
      );
    } catch (error) {
      console.error('Erro ao listar profissionais:', error);
      await this.messageFormatter.sendSystemUnavailableMessage(telefone);
      return;
    }
  }
}
