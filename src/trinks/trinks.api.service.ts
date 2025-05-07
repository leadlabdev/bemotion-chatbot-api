import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

// Definição das interfaces para os dados
export interface ClientResponse {
  data: Client[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface Client {
  id: number;
  dataCadastro: string;
  email: string | null;
  nome: string;
  telefones: Phone[];
  clienteDetalhes: any | null;
}

export interface Phone {
  ddd: string;
  telefone: string;
}

export interface CreateClientPayload {
  sexo: string;
  nome: string;
  telefones: {
    ddd: string;
    numero: string;
    tipoId: number;
  }[];
}

export interface CreateClientResponse {
  id: number;
}

export interface Service {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  duracaoEmMinutos: number;
  preco: number;
  visivelParaCliente: boolean;
}

export interface ServicesResponse {
  data: Service[];
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalRecords?: number;
}

export interface Professional {
  id: number;
  nome: string;
  cpf: string;
  apelido: string;
}

export interface ProfessionalsResponse {
  data: Professional[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface AvailabilityData {
  id: number;
  nome: string;
  horariosVagos: string[];
  intervalosVagos: {
    inicio: string;
    fim: string;
  }[];
}

export interface AvailabilityResponse {
  data: AvailabilityData[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface CreateAppointmentPayload {
  clienteId: number;
  profissionalId: number;
  valor: number;
  servicoId: number;
  duracaoEmMinutos: number;
  dataHoraInicio: string;
  observacoes: string;
}

export interface CreateAppointmentResponse {
  id: number;
}

@Injectable()
export class TrinksApiService {
  private readonly apiClient: AxiosInstance;
  private readonly estabelecimentoId: string;
  private readonly availableProfessionalIds = [702154, 702165];

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('TRINKS_API_KEY');
    if (!apiKey) {
      throw new Error('TRINKS_API_KEY is not defined in environment');
    }

    this.estabelecimentoId =
      this.configService.get<string>('TRINKS_ESTABELECIMENTO_ID') || '54027';

    this.apiClient = axios.create({
      baseURL: 'https://api.trinks.com/v1',
      headers: {
        'X-Api-Key': apiKey,
        accept: 'application/json',
        'content-type': 'application/json',
        estabelecimentoId: this.estabelecimentoId,
      },
    });
  }

  /**
   * Verifica se um cliente existe pelo número de telefone
   */
  async checkClientByPhone(phone: string): Promise<ClientResponse> {
    try {
      console.log(
        `[TrinksApiService] Consultando cliente pelo telefone: ${phone}`,
      );
      const response = await this.apiClient.get<ClientResponse>('/clientes', {
        params: {
          telefone: phone,
          incluirDetalhes: false,
        },
      });
      console.log(
        `[TrinksApiService] Cliente encontrado: ${response.data.totalRecords > 0}`,
      );
      return response.data;
    } catch (error) {
      console.error('[TrinksApiService] Erro ao consultar cliente:', error);
      throw this.handleApiError(error, 'Erro ao consultar cliente');
    }
  }

  /**
   * Cria um novo cliente
   */
  async createClient(
    payload: CreateClientPayload,
  ): Promise<CreateClientResponse> {
    try {
      console.log(`[TrinksApiService] Criando novo cliente: ${payload.nome}`);
      const response = await this.apiClient.post<CreateClientResponse>(
        '/clientes',
        payload,
      );
      console.log(
        `[TrinksApiService] Cliente criado com ID: ${response.data.id}`,
      );
      return response.data;
    } catch (error) {
      console.error('[TrinksApiService] Erro ao criar cliente:', error);
      throw this.handleApiError(error, 'Erro ao criar cliente');
    }
  }

  /**
   * Lista os serviços disponíveis
   */
  async listServices(searchTerm?: string): Promise<ServicesResponse> {
    try {
      const params: Record<string, any> = {
        somenteVisiveisCliente: false,
      };

      if (searchTerm) {
        params.nome = searchTerm;
      }

      console.log(
        `[TrinksApiService] Listando serviços${searchTerm ? ` com filtro: ${searchTerm}` : ''}`,
      );
      const response = await this.apiClient.get<ServicesResponse>('/servicos', {
        params,
      });
      console.log(
        `[TrinksApiService] ${response.data.data.length} serviços encontrados`,
      );
      return response.data;
    } catch (error) {
      console.error('[TrinksApiService] Erro ao listar serviços:', error);
      throw this.handleApiError(error, 'Erro ao listar serviços');
    }
  }

  /**
   * Lista todos os profissionais
   */
  async listProfessionals(): Promise<Professional[]> {
    try {
      console.log(`[TrinksApiService] Listando profissionais`);
      const response =
        await this.apiClient.get<ProfessionalsResponse>('/profissionais');
      console.log(
        `[TrinksApiService] ${response.data.data.length} profissionais encontrados`,
      );

      // Filtrando apenas pelos profissionais disponíveis
      const filteredProfessionals = response.data.data.filter((pro) =>
        this.availableProfessionalIds.includes(pro.id),
      );

      console.log(
        `[TrinksApiService] ${filteredProfessionals.length} profissionais disponíveis`,
      );
      return filteredProfessionals;
    } catch (error) {
      console.error('[TrinksApiService] Erro ao listar profissionais:', error);
      throw this.handleApiError(error, 'Erro ao listar profissionais');
    }
  }

  /**
   * Lista os serviços de um profissional específico
   */
  async listProfessionalServices(
    professionalId: number,
  ): Promise<ServicesResponse> {
    try {
      console.log(
        `[TrinksApiService] Listando serviços do profissional ID: ${professionalId}`,
      );
      const response = await this.apiClient.get<ServicesResponse>(
        `/profissionais/${professionalId}/servicos`,
      );
      console.log(
        `[TrinksApiService] ${response.data.data.length} serviços encontrados para o profissional`,
      );
      return response.data;
    } catch (error) {
      console.error(
        '[TrinksApiService] Erro ao listar serviços do profissional:',
        error,
      );
      throw this.handleApiError(
        error,
        'Erro ao listar serviços do profissional',
      );
    }
  }

  /**
   * Lista os horários disponíveis de um profissional em uma data específica
   */
  async listProfessionalAvailability(
    professionalId: number,
    date: string,
  ): Promise<AvailabilityResponse> {
    try {
      console.log(
        `[TrinksApiService] Consultando disponibilidade do profissional ID: ${professionalId} na data: ${date}`,
      );
      const response = await this.apiClient.get<AvailabilityResponse>(
        `/agendamentos/profissionais/${date}`,
        { params: { professionalId } },
      );
      console.log(
        `[TrinksApiService] Disponibilidade encontrada: ${response.data.data[0]?.horariosVagos.length || 0} horários`,
      );
      return response.data;
    } catch (error) {
      console.error(
        '[TrinksApiService] Erro ao consultar disponibilidade:',
        error,
      );
      throw this.handleApiError(error, 'Erro ao consultar disponibilidade');
    }
  }

  /**
   * Cria um novo agendamento
   */
  async createAppointment(
    payload: CreateAppointmentPayload,
  ): Promise<CreateAppointmentResponse> {
    try {
      console.log(
        `[TrinksApiService] Criando agendamento para cliente ID: ${payload.clienteId} com profissional ID: ${payload.profissionalId}`,
      );
      const response = await this.apiClient.post<CreateAppointmentResponse>(
        '/agendamentos',
        payload,
      );
      console.log(
        `[TrinksApiService] Agendamento criado com ID: ${response.data.id}`,
      );
      return response.data;
    } catch (error) {
      console.error('[TrinksApiService] Erro ao criar agendamento:', error);
      throw this.handleApiError(error, 'Erro ao criar agendamento');
    }
  }

  /**
   * Tratamento padronizado de erros da API
   */
  private handleApiError(error: any, defaultMessage: string): Error {
    const errorMessage =
      error.response?.data?.message || error.message || defaultMessage;
    const status = error.response?.status || 500;
    return new Error(`[${status}] ${errorMessage}`);
  }
}
