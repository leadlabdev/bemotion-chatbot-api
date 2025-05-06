import { Injectable } from '@nestjs/common';
import { GptService } from 'src/openai/openai.service';
import { TwilioService } from 'src/twilio/twilio.service';

@Injectable()
export class FreeMessageProcessorService {
  constructor(
    private readonly gptService: GptService,
    private readonly twilioService: TwilioService,
  ) {}

  async processMessage(
    phoneNumber: string,
    userMessage: string,
    userName?: string,
  ): Promise<void> {
    try {
      console.log(
        'FreeMessageProcessorService - message:',
        userMessage,
        'name:',
        userName,
      );

      const gptResponse = await this.gptService.generateResponse(
        userMessage,
        userName,
        phoneNumber,
      );

      await this.twilioService.sendMessage(phoneNumber, gptResponse);
    } catch (error) {
      console.error('Error generating GPT response:', error);
      const fallbackMessage =
        'Sorry, there was an error processing your message. Please try again.';
      await this.twilioService.sendMessage(phoneNumber, fallbackMessage);
    }
  }
}
