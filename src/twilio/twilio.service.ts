import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService implements OnModuleInit {
  private client: Twilio;
  private twilioNumber: string;

  constructor(private configService: ConfigService) {
    const accountSid = this.getConfigOrThrow('TWILIO_ACCOUNT_SID');
    const authToken = this.getConfigOrThrow('TWILIO_AUTH_TOKEN');
    this.twilioNumber = this.getConfigOrThrow('TWILIO_WHATSAPP_NUMBER');

    this.client = new Twilio(accountSid, authToken);
  }

  onModuleInit() {
    // Validar configurações na inicialização do módulo
    this.validateConfigurations();
  }

  private getConfigOrThrow(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Configuração necessária "${key}" não encontrada`);
    }
    return value;
  }

  private validateConfigurations() {
    const requiredConfigs = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_WHATSAPP_NUMBER',
    ];

    for (const config of requiredConfigs) {
      this.getConfigOrThrow(config);
    }
  }

  private formatWhatsAppNumber(number: string): string {
    let cleanNumber = number.replace('whatsapp:', '');

    if (!cleanNumber.startsWith('+')) {
      cleanNumber = `+55${cleanNumber}`;
    }

    return `whatsapp:${cleanNumber}`;
  }

  async sendMessage(to: string, body: string) {
    if (!to || typeof to !== 'string') {
      console.error('Erro: Número do destinatário inválido:', to);
      throw new Error('Número do destinatário inválido.');
    }

    const fromNumber = this.formatWhatsAppNumber(this.twilioNumber);
    const toNumber = this.formatWhatsAppNumber(to);

    try {
      console.log(`Enviando mensagem de ${fromNumber} para ${toNumber}`);
      return await this.client.messages.create({
        from: fromNumber,
        to: toNumber,
        body,
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }
}
