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
    const rawPrompt = prompts[promptKey]?.prompt || '';
    const prompt = interpolatePrompt(rawPrompt, context);
    console.log('formatterService - prompt', prompt);
    console.log('formatterService - context', context);
    const response = await this.openAiService.generateResponse(
      prompt,
      context,
      telefone,
    );

    await this.twilioService.sendMessage(telefone, response);
    return response;
  }
}
