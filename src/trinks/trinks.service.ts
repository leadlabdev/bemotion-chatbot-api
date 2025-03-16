import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TrinksService {
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;
  private readonly estabelecimentoId: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = 'https://api.trinks.com/v1/agendamentos';
    this.apiKey = this.configService.get<string>('TRINKS_API_KEY');
    this.estabelecimentoId = this.configService.get<string>(
      'TRINKS_ESTABELECIMENTO_ID',
    );
  }

  async getAgendamentos() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.apiUrl, {
          headers: {
            'X-Api-Key': this.apiKey,
            accept: 'application/json',
            estabelecimentoId: this.estabelecimentoId,
          },
        }),
      );

      console.log('Resposta da API Trinks:', response.data); // 🛠️ Debug

      // Retorna o array correto de agendamentos
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw new Error('Erro ao buscar agendamentos.');
    }
  }

  async getServicos() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://api.trinks.com/v1/servicos?somenteVisiveisCliente=true',
          {
            headers: {
              'X-Api-Key': this.apiKey,
              accept: 'application/json',
              estabelecimentoId: this.estabelecimentoId,
            },
          },
        ),
      );

      console.log('Resposta da API Trinks (Serviços):', response.data);
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      throw new Error('Erro ao buscar serviços.');
    }
  }

  async getProfissionaisAgenda(date: string) {
    try {
      const url = `https://api.trinks.com/v1/agendamentos/profissionais/${date}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'X-Api-Key': this.apiKey,
            accept: 'application/json',
            estabelecimentoId: this.estabelecimentoId,
          },
        }),
      );

      console.log('Resposta da API Trinks (Profissionais):', response.data); // 🛠️ Debug

      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      console.error('Erro ao buscar profissionais com agenda:', error);
      throw new Error('Erro ao buscar profissionais com agenda.');
    }
  }
  async getClientes(nome?: string, incluirDetalhes = true) {
    try {
      const url = `https://api.trinks.com/v1/clientes?incluirDetalhes=${incluirDetalhes}${nome ? `&nome=${encodeURIComponent(nome)}` : ''}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'X-Api-Key': this.apiKey,
            accept: 'application/json',
            estabelecimentoId: this.estabelecimentoId,
          },
        }),
      );

      console.log('Resposta da API Trinks (Clientes):', response.data);

      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error('Erro ao buscar clientes.');
    }
  }

  async createAgendamento(
    clienteId: number,
    servicoId: number,
    profissionalId: number,
    dataHoraInicio: string,
    duracaoEmMinutos: number,
    valor: number,
    observacoes: string,
  ) {
    try {
      const url = this.apiUrl;

      const requestData = {
        clienteId,
        servicoId,
        profissionalId,
        dataHoraInicio,
        duracaoEmMinutos,
        valor,
        observacoes,
      };

      const response = await firstValueFrom(
        this.httpService.post(url, requestData, {
          headers: {
            'X-Api-Key': this.apiKey,
            accept: 'application/json',
            'content-type': 'application/json',
            estabelecimentoId: this.estabelecimentoId,
          },
        }),
      );

      console.log(
        'Resposta da API Trinks (Criação de Agendamento):',
        response.data,
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw new Error('Erro ao criar agendamento.');
    }
  }

  async createCliente(clienteData: {
    nome: string;
    sexo: string;
    telefones: { ddd: string; numero: string; tipoId: number }[];
  }) {
    try {
      const url = 'https://api.trinks.com/v1/clientes';

      const response = await firstValueFrom(
        this.httpService.post(url, clienteData, {
          headers: {
            'X-Api-Key': this.apiKey,
            accept: 'application/json',
            'content-type': 'application/json',
            estabelecimentoId: this.estabelecimentoId,
          },
        }),
      );

      console.log('Resposta da API Trinks (Criar Cliente):', response.data);

      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Erro ao criar cliente.');
    }
  }
}
