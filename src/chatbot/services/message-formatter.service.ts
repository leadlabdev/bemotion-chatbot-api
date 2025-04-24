import { Injectable } from '@nestjs/common';
import { GptService } from 'src/openai/openai.service';
import { TwilioService } from 'src/twilio/twilio.service';
import prompts from '../../config/prompts.json';

function interpolatePrompt(
  prompt: string,
  context: Record<string, any>,
): string {
  return prompt.replace(/{{(.*?)}}/g, (_, key) => context[key.trim()] ?? '');
}

@Injectable()
export class MessageFormatterService {
  constructor(
    private readonly openAiService: GptService,
    private readonly twilioService: TwilioService,
  ) {}

  async formatAndSend(
    telefone: string,
    promptKey: string,
    context: any = {},
  ): Promise<string> {
    console.log('formatterService - promptKey:', promptKey);

    let effectivePrompt = '';
    let effectiveContext = { ...context };
    console.log('effectiveContext', effectiveContext);
    if (promptKey === 'menu_principal_livre') {
      effectiveContext = {
        mensagem: context.mensagem,
        nome: context.nome,
        isFirstMessage: false,
      };
    } else if (promptKey === 'menu_principal_boas_vindas') {
      effectiveContext = {
        mensagem: `Olá, sou um cliente novo.`,
        nome: context.nome,
        isFirstMessage: true,
      };
    } else {
      effectivePrompt = interpolatePrompt(
        prompts[promptKey]?.prompt || '',
        context,
      );
      effectiveContext.isFirstMessage = !context.saudacaoEnviada;
    }

    console.log(
      '**************vai pro gpt',
      effectivePrompt,
      effectiveContext,
      telefone,
    );
    const response = await this.openAiService.generateResponse(
      effectivePrompt,
      effectiveContext,
      telefone,
    );

    await this.twilioService.sendMessage(telefone, response);
    return response;
  }

  async sendSystemUnavailableMessage(telefone: string): Promise<string> {
    const msg =
      'Desculpe, estamos com uma indisponibilidade temporária no sistema. Por favor, tente novamente mais tarde ou entre em contato pelo telefone (11) 5096-6043.';
    await this.twilioService.sendMessage(telefone, msg);
    return msg;
  }
}
