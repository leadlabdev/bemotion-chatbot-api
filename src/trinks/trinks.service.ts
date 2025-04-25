import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TrinksService {
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;
  private readonly estabelecimentoId: string | undefined;
  private readonly allowedProfessionalIds: number[] = [702154, 702165];
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

  async listarServicos() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://api.trinks.com/v1/servicos?nome=(IA)&categoria=IA&somenteVisiveisCliente=false',
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

  async listarProfissionais(): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.trinks.com/v1/profissionais', {
          headers: {
            'X-Api-Key': this.apiKey,
            accept: 'application/json',
            estabelecimentoId: this.estabelecimentoId,
          },
        }),
      );

      console.log('Resposta da API Trinks (Profissionais):', response.data);
      const professionals = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      return professionals.filter((pro) =>
        this.allowedProfessionalIds.includes(pro.id),
      );
    } catch (error) {
      console.error(
        'Erro ao buscar profissionais:',
        error.response?.data || error.message,
      );
      throw new Error('Erro ao buscar profissionais.');
    }
  }
  async listarProfissionaisComAgenda(
    date: string,
    profissionalId?: number,
  ): Promise<any[]> {
    try {
      const url = new URL(`${this.apiUrl}/profissionais/${date}`);
      if (profissionalId) {
        url.searchParams.append('profissionalId', profissionalId.toString());
      }

      const response = await firstValueFrom(
        this.httpService.get(url.toString(), {
          headers: {
            'X-Api-Key': this.apiKey,
            accept: 'application/json',
            estabelecimentoId: this.estabelecimentoId,
          },
        }),
      );

      console.log(
        'Resposta da API Trinks (Profissionais com Agenda):',
        response.data,
      );
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      console.error('Erro ao buscar profissionais com agenda:', error);
      throw new Error('Erro ao buscar profissionais com agenda.');
    }
  }

  async identificarClientePorTelefone(telefone: string) {
    try {
      // Remover o prefixo "whatsapp:" e o código de país "+55"
      const telefoneFormatado = telefone
        .replace('whatsapp:', '')
        .replace('+55', '')
        .trim();
      console.log('Telefone formatado para consulta:', telefoneFormatado);

      const url = `https://api.trinks.com/v1/clientes?telefone=${telefoneFormatado}&incluirDetalhes=false`;
      const apiKey = 'kdy1HCm2Is6Oj4EYeNupN2la9k2dYqot7vorGi89';
      const estabelecimentoId = '54027'; // Substitua pelo seu ID

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
          accept: 'application/json',
          estabelecimentoId: estabelecimentoId,
        },
      });

      const data = await response.json();
      console.log('Resposta da API:', data);

      // Check for API error messages
      if (data.message && typeof data.message === 'string') {
        return {
          success: false,
          error: 'api_error',
          message: data.message,
        };
      }

      if (data.data && data.data.length > 0) {
        return {
          success: true,
          clientes: data.data,
        };
      } else {
        return {
          success: true,
          clientes: [],
        };
      }
    } catch (error) {
      console.error('Erro ao consultar a API Trinks:', error);
      return {
        success: false,
        error: 'connection_error',
        message: 'Falha na conexão com o sistema',
      };
    }
  }

  async createCliente(
    nome: string,
    sexo: string,
    telefone: { ddd: string; numero: string; tipoId: number },
  ) {
    try {
      const url = 'https://api.trinks.com/v1/clientes';

      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            nome,
            sexo,
            telefones: [telefone],
          },
          {
            headers: {
              'X-Api-Key': this.apiKey,
              accept: 'application/json',
              'content-type': 'application/json',
              estabelecimentoId: this.estabelecimentoId,
            },
          },
        ),
      );

      console.log('Resposta da API Trinks (Criar Cliente):', response.data);

      return response.data;
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Erro ao criar cliente.');
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
}
