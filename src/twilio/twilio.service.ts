import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  private client: Twilio;

  constructor(private configService: ConfigService) {
    this.client = new Twilio(
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendMessage(to: string, body: string) {
    return this.client.messages.create({
      from: this.configService.get<string>('TWILIO_WHATSAPP_NUMBER'),
      to,
      body,
    });
  }
}
