import { Injectable } from '@nestjs/common';
import { GptService } from 'src/openai/openai.service';
import { TwilioService } from 'src/twilio/twilio.service';
import prompts from '../../config/prompts.json';

// 👇 Função auxiliar fora da classe
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
    const rawPrompt = prompts[promptKey]?.prompt || '';
    const prompt = interpolatePrompt(rawPrompt, context); // 🔄 Interpolando aqui

    console.log('promptKey:', promptKey);
    console.log('prompt:', prompt);
    console.log('context:', context);
    console.log('telefone:', telefone);

    const response = await this.openAiService.generateResponse(
      prompt,
      context,
      telefone,
    );

    console.log('response:', response);
    await this.twilioService.sendMessage(telefone, response);
    return response;
  }
}
