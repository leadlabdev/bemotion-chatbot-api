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

    // Tratamento especial para 'menu_principal_livre' e 'menu_principal_boas_vindas'
    if (promptKey === 'menu_principal_livre') {
      // Envia apenas a mensagem sem prompt adicional
      effectiveContext = {
        mensagem: context.mensagem,
        nome: context.nome,
        isFirstMessage: false,
      };
    } else if (promptKey === 'menu_principal_boas_vindas') {
      // Identifica primeiro contato
      effectiveContext = {
        mensagem: `Olá, sou um cliente novo.`,
        nome: context.nome,
        isFirstMessage: true,
      };
    } else {
      // Para outros casos, usa os prompts configurados
      effectivePrompt = interpolatePrompt(
        prompts[promptKey]?.prompt || '',
        context,
      );
      effectiveContext.isFirstMessage = !context.saudacaoEnviada;
    }

    // Log apenas para depuração
    console.log('formatterService - context', effectiveContext);

    // Gera e envia a resposta
    const response = await this.openAiService.generateResponse(
      effectivePrompt,
      effectiveContext,
      telefone,
    );

    await this.twilioService.sendMessage(telefone, response);
    return response;
  }
}
