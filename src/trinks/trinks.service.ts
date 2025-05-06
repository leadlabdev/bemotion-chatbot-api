import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TrinksService {
  private trinksApiKey: string | undefined;
  private trinksBaseUrl: string;
  private estabelecimentoId: number | undefined;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.trinksApiKey = this.configService.get<string>('TRINKS_API_KEY');
    this.trinksBaseUrl = this.configService.get<string>(
      'TRINKS_BASE_URL',
      'https://api.trinks.com/v1',
    );
    this.estabelecimentoId = this.configService.get<number>(
      'TRINKS_ESTABELECIMENTO_ID',
    );
  }

  async checkClientByPhone(phone: string): Promise<any> {
    try {
      console.log(
        `[TrinksService] Consultando cliente: telefone=${phone}, estabelecimentoId=${this.estabelecimentoId}`,
      );
      const response = await firstValueFrom(
        this.httpService.get(`${this.trinksBaseUrl}/clientes`, {
          headers: {
            'X-Api-Key': this.trinksApiKey,
            accept: 'application/json',
            estabelecimentoId: this.estabelecimentoId?.toString(),
          },
          params: {
            telefone: phone,
            incluirDetalhes: false,
          },
        }),
      );
      console.log(
        `[TrinksService] Resposta da API Trinks:`,
        JSON.stringify(response.data),
      );
      return response.data;
    } catch (error) {
      console.error(
        `[TrinksService] Erro ao consultar cliente: ${error.message}`,
        error.response?.data,
      );
      return { data: [] };
    }
  }

  createAppoitment(
    clienteId: number,
    servicoId: number,
    profissionalId: number,
    dataHoraInicio: string,
    duracaoEmMinutos: number,
    valor: number,
    observacoes: string,
  ) {
    throw new Error('Method not implemented.');
  }
}
