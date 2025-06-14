import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  AppointmentsResponse,
  ClientResponse,
  CreateAppointmentPayload,
  CreateAppointmentResponse,
  CreateClientPayload,
  CreateClientResponse,
  ListAppointmentsFilters,
  Professional,
  ServicesResponse,
} from './types';
import { mockServices } from './mockServices';

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
      console.log(
        `[TrinksApiService] Listando serviços${searchTerm ? ` com filtro: ${searchTerm}` : ''}`,
      );

      // Filtrar por termo de busca se fornecido
      const filteredServices = searchTerm
        ? mockServices.filter(
            (service) =>
              service.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
              service.categoria
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
          )
        : mockServices;

      // Simular a estrutura de resposta da API
      const mockResponse: ServicesResponse = {
        data: filteredServices,
        // Adicione outros campos da ServicesResponse se necessário
        // como total, pagination, etc.
      };

      console.log(
        `[TrinksApiService] ${mockResponse.data.length} serviços encontrados`,
      );

      // Simular delay da API (opcional)
      await new Promise((resolve) => setTimeout(resolve, 500));

      return mockResponse;
    } catch (error) {
      console.error('[TrinksApiService] Erro ao listar serviços:', error);
      throw this.handleApiError(error, 'Erro ao listar serviços');
    }
  }

  async listProfessionals(): Promise<Professional[]> {
    try {
      console.log(`[TrinksApiService] Listando profissionais`);

      // Mocked data
      const mockedProfessionals: Professional[] = [
        {
          id: 657506,
          nome: 'Cristiana do Santos Nobre',
          cpf: '37355656899',
          apelido: '01 Cristiana',
        },
        {
          id: 746338,
          nome: 'EMERSON GOMES DO NASCIMENTO',
          cpf: '03999766395',
          apelido: '00 EMERSON',
        },
        {
          id: 209030,
          nome: 'Jackson Amorim da Silva',
          cpf: '22810623848',
          apelido: '00 Jackson',
        },
        {
          id: 505936,
          nome: 'Jane Alves Siqueira',
          cpf: '14867811874',
          apelido: '01 Jane',
        },
        {
          id: 284833,
          nome: 'Jardel Xavier de Lima',
          cpf: '32310472859',
          apelido: '00 Dell',
        },
        {
          id: 635516,
          nome: 'Luana Menandro Maximiano',
          cpf: '03295078262',
          apelido: '00 Luana Menandro',
        },
        {
          id: 618259,
          nome: 'VALDIR FOGAÇA DE OLIVEIRA',
          cpf: '27859122847',
          apelido: '00 Val',
        },
        {
          id: 229782,
          nome: 'Yuri Ramos Oliveira',
          cpf: '43538837805',
          apelido: '00 Yuri Ramos',
        },
      ];

      console.log(
        `[TrinksApiService] ${mockedProfessionals.length} profissionais encontrados`,
      );

      // Filtrando apenas pelos profissionais disponíveis (se necessário)
      const filteredProfessionals = mockedProfessionals;

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
  async getProfessionalAvailability(
    professionalId: number,
    date: string,
    servicoId: number,
    estabelecimentoId: number,
    servicoDuracao?: number,
  ): Promise<any> {
    try {
      console.log(
        `[TrinksApiService] Verificando disponibilidade do profissional ID: ${professionalId} para o serviço ID: ${servicoId} na data: ${date}`,
      );
      const params: Record<string, any> = {
        professionalId,
        servicoId,
        excluirExcecoesDeAgendamentoOnline: true,
      };

      if (servicoDuracao) {
        params.servicoDuracao = servicoDuracao;
      }

      const response = await this.apiClient.get(
        `/agendamentos/profissionais/${date}`,
        {
          params,
          headers: { estabelecimentoId: estabelecimentoId.toString() },
        },
      );

      // Log da resposta completa para depuração
      console.log(
        `[TrinksApiService] Resposta completa: ${JSON.stringify(response.data)}`,
      );

      // Extrair dados do profissional do array data
      const professionalData = response.data.data?.[0] || {};
      const horariosVagos = professionalData.horariosVagos || [];
      const intervalosVagos = professionalData.intervalosVagos || [];

      console.log(
        `[TrinksApiService] Horários disponíveis encontrados: ${horariosVagos.length}`,
      );

      // Retornar no formato que o resto do sistema espera
      return {
        horariosVagos: horariosVagos,
        intervalosVagos: intervalosVagos,
      };
    } catch (error) {
      console.error(
        `[TrinksApiService] Erro ao verificar disponibilidade do profissional ${professionalId}:`,
        error,
      );
      // Em vez de lançar exceção, retornar objeto vazio para evitar quebrar o fluxo do chat
      return { horariosVagos: [], intervalosVagos: [] };
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
   * Lista os agendamentos do estabelecimento
   */
  async listAppointments(
    estabelecimentoId: number,
    filters?: ListAppointmentsFilters,
  ): Promise<AppointmentsResponse> {
    try {
      console.log(
        `[TrinksApiService] Listando agendamentos do estabelecimento ID: ${estabelecimentoId}`,
      );

      const params: Record<string, any> = {};

      if (filters) {
        if (filters.clientId) params.clienteId = filters.clientId;
        if (filters.startDate) params.dataInicio = filters.startDate;
        if (filters.endDate) params.dataFim = filters.endDate;
        if (filters.page) params.page = filters.page;
        if (filters.pageSize) params.pageSize = filters.pageSize;
      }

      const response = await this.apiClient.get<AppointmentsResponse>(
        '/agendamentos',
        {
          params,
          headers: { estabelecimentoId: estabelecimentoId.toString() },
        },
      );

      console.log(
        `[TrinksApiService] ${response.data.data.length} agendamentos encontrados`,
      );
      return response.data;
    } catch (error) {
      console.error('[TrinksApiService] Erro ao listar agendamentos:', error);
      throw this.handleApiError(error, 'Erro ao listar agendamentos');
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
