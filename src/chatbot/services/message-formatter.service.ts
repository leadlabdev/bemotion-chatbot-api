import { Injectable } from '@nestjs/common';
import { GptService } from 'src/openai/openai.service';
import { TwilioService } from 'src/twilio/twilio.service';
import prompts from '../../config/prompts.json';

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
    const prompt = prompts[promptKey]?.prompt || '';
    const response = await this.openAiService.generateResponse(prompt, context);
    await this.twilioService.sendMessage(telefone, response);
    return response;
  }
}
