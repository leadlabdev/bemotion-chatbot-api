import { Injectable } from '@nestjs/common';
import { GptService } from 'src/openai/openai.service';
import { iniciarAgendamentoPrompts } from 'src/prompts/iniciar-cadastro-cliente';
import { TwilioService } from 'src/twilio/twilio.service';

interface Context {
  mensagem?: string;
  nome?: string;
  isFirstMessage?: boolean;
  listaFormatada?: string;
  servicoEscolhido?: string;
  escolhaInvalida?: string;
  profissionalEscolhido?: string;
  dataEscolhida?: string;
  horarioEscolhido?: string;
  duracao?: string;
  valor?: string;
}

@Injectable()
export class MessageFormatterService {
  private directMessagePrompts = [
    'selecionar_servico',
    'selecionar_servico_invalido',
    'selecionar_profissional',
    'sem_profissionais_disponiveis',
    'selecionar_data',
    'erro_data_invalida',
    'selecionar_horario',
    'sem_horarios_disponiveis',
    'confirmar_agendamento',
    'confirmar_agendamento_sucesso',
    'confirmar_agendamento_cancelar',
    'confirmar_agendamento_invalido',
    'confirmar_agendamento_erro',
  ];

  private mensagens = {
    ...iniciarAgendamentoPrompts,
    menu_principal: (nome: string) => ({
      mensagem: `Olá, ${nome}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`,
      isFirstMessage: true,
    }),

    default: (nome: string) => ({
      mensagem: `Desculpe, ${nome}, não entendi. Vamos tentar novamente?`,
      isFirstMessage: false,
    }),
  };

  constructor(
    private readonly openAiService: GptService,
    private readonly twilioService: TwilioService,
  ) {}

  async formatAndSend(
    telefone: string,
    promptKey: string,
    context: Context = {},
  ): Promise<string> {
    console.log('formatterService - promptKey:', promptKey);

    const nome = context.nome || 'Cliente';
    const mensagemConfig = this.mensagens[promptKey]
      ? this.mensagens[promptKey](
          nome,
          context.listaFormatada,
          context.escolhaInvalida,
          context.profissionalEscolhido,
          context.servicoEscolhido,
          context.dataEscolhida,
          context.horarioEscolhido,
          context.duracao,
          context.valor,
        )
      : this.mensagens.default(nome);

    const effectiveContext: Context = { ...context, nome, ...mensagemConfig };
    console.log('effectiveContext', effectiveContext);

    if (this.directMessagePrompts.includes(promptKey)) {
      await this.twilioService.sendMessage(
        telefone,
        effectiveContext.mensagem!,
      );
      return effectiveContext.mensagem!;
    }

    try {
      let gptInput = '';
      if (promptKey === 'menu_principal_livre') {
        gptInput = effectiveContext.mensagem!;
      }
      const response = await this.openAiService.generateResponse(
        gptInput,
        effectiveContext,
        telefone,
      );
      await this.twilioService.sendMessage(telefone, response);
      return response;
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      const errorMsg = await this.sendSystemUnavailableMessage(telefone);
      throw error;
    }
  }

  async sendSystemUnavailableMessage(telefone: string): Promise<string> {
    const msg =
      'Desculpe, estamos com uma indisponibilidade temporária no sistema. ' +
      'Por favor, tente novamente mais tarde ou entre em contato pelo telefone (11) 5096-6043.';
    await this.twilioService.sendMessage(telefone, msg);
    return msg;
  }
}
