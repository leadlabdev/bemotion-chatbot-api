import { Injectable } from '@nestjs/common';
import { AgendamentoService } from 'src/agendamentos/agendamentos.service';
import { ChatbotState } from './chatbot-state.interface';
import { ChatbotController } from '../controllers/chatbot.controller';
import { MessageFormatterService } from '../services/message-formatter.service';

@Injectable()
export class SelecionarServicoState implements ChatbotState {
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

    // Se a sessão não tiver serviços listados, buscar e formatar a lista
    if (!session.servicos) {
      const servicos = await this.agendamentoService.listarServicos();
      session.servicos = servicos;

      const listaFormatada = servicos
        .map((s, index) => `${index + 1}. ${s.nome}`)
        .join('\n');

      // Enviar mensagem com a lista de serviços
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
    }

    // Processar a escolha do usuário
    const escolha = parseInt(userMessage.trim());

    if (isNaN(escolha) || escolha < 1 || escolha > session.servicos.length) {
      const listaFormatada = session.servicos
        .map((s, index) => `${index + 1}. ${s.nome}`)
        .join('\n');

      // Enviar mensagem de erro para escolha inválida
      await this.messageFormatter.formatAndSend(
        telefone,
        'selecionar_servico_invalido',
        {
          nome: session.nome,
          escolhaInvalida: userMessage,
          servicos: session.servicos,
          listaFormatada,
        },
      );
      return;
    }

    // Atualizar sessão com o serviço selecionado
    const servicoIndex = escolha - 1;
    session.servicoSelecionado = session.servicos[servicoIndex];
    session.etapa = 'selecionar_profissional';

    // Listar profissionais e enviar mensagem
    const profissionais = await this.agendamentoService.listarProfissionais();
    session.profissionais = profissionais;
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

    // Atualizar a sessão no controller
    controller.updateSession(telefone, session);
  }
}
