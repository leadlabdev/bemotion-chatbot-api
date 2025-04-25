import { Injectable } from '@nestjs/common';
import { ChatbotState } from '../chatbot-state.interface';
import { MessageFormatterService } from '../../services/message-formatter.service';
import { ChatbotController } from '../../controllers/chatbot.controller';

@Injectable()
export class SelecionarHoraState implements ChatbotState {
  constructor(private readonly messageFormatter: MessageFormatterService) {}

  async handle(
    controller: ChatbotController,
    telefone: string,
    userMessage: string,
  ): Promise<void> {
    console.log('SelecionarHoraState - handle:', { telefone, userMessage });
    const session = controller.getSession(telefone);
    const escolha = parseInt(userMessage.trim()) - 1;

    if (
      isNaN(escolha) ||
      escolha < 0 ||
      !session.horariosDisponiveis ||
      escolha >= session.horariosDisponiveis.length
    ) {
      // Escolha inválida, reenvia a lista de horários
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
          escolhaInvalida: userMessage,
        },
      );
      return;
    }

    session.horarioEscolhido = session.horariosDisponiveis[escolha];
    session.etapa = 'confirmar_agendamento'; // Transiciona para o próximo estado

    await this.messageFormatter.formatAndSend(
      telefone,
      'confirmar_agendamento',
      {
        nome: session.nome,
        servicoEscolhido: session.servicoSelecionado.nome,
        profissionalEscolhido: session.profissionalSelecionado.nome,
        dataEscolhida: session.dataSelecionada,
        horarioEscolhido: session.horarioEscolhido,
      },
    );

    controller.updateSession(telefone, session);
  }
}
