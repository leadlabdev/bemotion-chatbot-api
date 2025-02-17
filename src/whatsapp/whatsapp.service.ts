import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.accessToken =
      this.configService.get<string>('META_WHATSAPP_ACCESS_TOKEN') || '';
    this.phoneNumberId =
      this.configService.get<string>('META_WHATSAPP_PHONE_NUMBER_ID') || '';

    this.apiUrl = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;
  }

  async sendMessage(to: string, message: string) {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    };

    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const response: AxiosResponse | undefined = await lastValueFrom(
        this.httpService.post(this.apiUrl, payload, { headers }),
      );

      if (!response) {
        throw new Error('Resposta da API está indefinida.');
      }

      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      throw new Error('Falha ao enviar mensagem pelo WhatsApp');
    }
  }
}
