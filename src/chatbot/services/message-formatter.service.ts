import { Injectable } from '@nestjs/common';
import { iniciarAgendamentoPrompts } from 'src/prompts/iniciar-agendamento';
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
  private mensagens = {
    ...iniciarAgendamentoPrompts,
    menu_principal: (nome: string) => ({
      mensagem: `Olá, ${nome}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`,
    }),
    default: (nome: string) => ({
      mensagem: `Desculpe, ${nome}, não entendi. Vamos tentar novamente?`,
    }),
  };

  constructor(private readonly twilioService: TwilioService) {}

  async formatAndSend(
    telefone: string,
    promptKey: string,
    context: Context = {},
  ): Promise<string> {
    console.log('formatterService - promptKey:', promptKey);

    const nome = context.nome || 'Cliente';
    // Log arguments for debugging
    console.log('Arguments for prompt:', {
      nome,
      listaFormatada: context.listaFormatada,
      escolhaInvalida: context.escolhaInvalida,
      servicoEscolhido: context.servicoEscolhido,
      profissionalEscolhido: context.profissionalEscolhido,
      dataEscolhida: context.dataEscolhida,
      horarioEscolhido: context.horarioEscolhido,
      duracao: context.duracao,
      valor: context.valor,
    });

    const mensagemConfig = this.mensagens[promptKey]
      ? this.mensagens[promptKey](
          nome,
          context.listaFormatada,
          context.escolhaInvalida,
          context.servicoEscolhido,
          context.profissionalEscolhido,
          context.dataEscolhida,
          context.horarioEscolhido,
          context.duracao,
          context.valor,
        )
      : this.mensagens.default(nome);

    // Ensure mensagem is defined
    const effectiveContext: Context = {
      ...context,
      nome,
      mensagem: mensagemConfig.mensagem || 'Mensagem não configurada.',
    };
    console.log('effectiveContext', effectiveContext);

    // Validate mensagem before sending
    if (!effectiveContext.mensagem) {
      console.error('No message defined for prompt:', promptKey);
      effectiveContext.mensagem = 'Erro interno. Por favor, tente novamente.';
    }

    await this.twilioService.sendMessage(telefone, effectiveContext.mensagem);
    return effectiveContext.mensagem;
  }

  async sendSystemUnavailableMessage(telefone: string): Promise<string> {
    const msg =
      'Desculpe, estamos com uma indisponibilidade temporária no sistema. ' +
      'Por favor, tente novamente mais tarde ou entre em contato pelo telefone (11) 5096-6043.';
    await this.twilioService.sendMessage(telefone, msg);
    return msg;
  }
}
