import { Injectable } from '@nestjs/common';
import { ChatbotState } from '../chatbot-state.interface';
import { MessageFormatterService } from '../../services/message-formatter.service';
import { ChatbotController } from '../../controllers/chatbot.controller';
import { TrinksService } from 'src/trinks/trinks.service'; // Importe o TrinksService

@Injectable()
export class SelecionarDataState implements ChatbotState {
  constructor(
    private readonly messageFormatter: MessageFormatterService,
    private readonly trinksService: TrinksService, // Injete o TrinksService
  ) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    console.log('SelecionarDataState - handle:', {
      telefone,
      userMessage,
    });
    const session = controller.getSession(telefone);

    // Validar o formato da data (ex: DD/MM/AAAA) - Implementar validação robusta
    const dataRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dataRegex.test(userMessage.trim())) {
      await this.messageFormatter.formatAndSend(
        telefone,
        'erro_data_invalida',
        {
          nome: session.nome,
          dataEscolhida: userMessage,
        },
      );
      return;
    }

    session.dataSelecionada = userMessage.trim();
    session.etapa = 'selecionar_hora'; // Próxima etapa

    try {
      const profissionalId = session.profissionalSelecionado.id;
      const horariosAgenda =
        await this.trinksService.listarProfissionaisComAgenda(
          this.formatDateToYYYYMMDD(session.dataSelecionada), // Formatar data para YYYY-MM-DD
          profissionalId,
        );

      if (
        horariosAgenda &&
        horariosAgenda.length > 0 &&
        horariosAgenda[0].horariosVagos
      ) {
        session.horariosDisponiveis = horariosAgenda[0].horariosVagos; // Armazena os horários na sessão
        const listaFormatada = session.horariosDisponiveis
          .map((horario, index) => `${index + 1}. ${horario}`)
          .join('\n');

        await this.messageFormatter.formatAndSend(
          telefone,
          'selecionar_horario',
          {
            nome: session.nome,
            servicoEscolhido: session.servicoSelecionado.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: session.dataSelecionada,
            listaFormatada,
          },
        );
      } else {
        await this.messageFormatter.formatAndSend(
          telefone,
          'sem_horarios_disponiveis',
          {
            nome: session.nome,
            profissionalEscolhido: session.profissionalSelecionado.nome,
            dataEscolhida: session.dataSelecionada,
          },
        );
        session.etapa = 'selecionar_data'; // Voltar para escolher outra data
      }

      controller.updateSession(telefone, session);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      await this.messageFormatter.sendSystemUnavailableMessage(telefone);
    }
  }

  private formatDateToYYYYMMDD(dateString: string): string {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  }
}
