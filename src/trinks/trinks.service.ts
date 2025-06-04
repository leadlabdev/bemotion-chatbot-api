import { Injectable } from '@nestjs/common';
import { TrinksApiService } from './trinks.api.service';
import { AvailabilityResponse, Client, CreateClientPayload } from './types';

@Injectable()
export class TrinksService {
  constructor(private trinksApiService: TrinksApiService) {}

  /**
   * Verifica se um cliente existe pelo número de telefone
   */
  async checkClientByPhone(phone: string): Promise<{ data: Client[] }> {
    try {
      console.log(
        `[TrinksService] Verificando cliente pelo telefone: ${phone}`,
      );
      // Normaliza o telefone removendo caracteres não numéricos
      const normalizedPhone = phone.replace(/\D/g, '');

      // Verifica se o telefone tem pelo menos 10 dígitos (DDD + número)
      if (normalizedPhone.length < 10) {
        console.log(`[TrinksService] Telefone inválido: ${phone}`);
        return { data: [] };
      }

      const result =
        await this.trinksApiService.checkClientByPhone(normalizedPhone);
      return { data: result.data };
    } catch (error) {
      console.error(`[TrinksService] Erro ao verificar cliente:`, error);
      return { data: [] };
    }
  }

  /**
   * Cria um novo cliente
   */
  async createClient(
    name: string,
    phone: string,
    gender: string = 'F',
  ): Promise<number | null> {
    try {
      console.log(
        `[TrinksService] Criando cliente: ${name}, telefone: ${phone}`,
      );
      // Normaliza o telefone removendo caracteres não numéricos
      const normalizedPhone = phone.replace(/\D/g, '');

      if (normalizedPhone.length < 10) {
        console.log(
          `[TrinksService] Telefone inválido para criar cliente: ${phone}`,
        );
        return null;
      }

      // Extrai DDD e número
      const ddd = normalizedPhone.substring(0, 2);
      const numero = normalizedPhone.substring(2);

      const payload: CreateClientPayload = {
        nome: name,
        sexo: gender,
        telefones: [
          {
            ddd,
            numero,
            tipoId: 1, // Tipo padrão de telefone
          },
        ],
      };

      const result = await this.trinksApiService.createClient(payload);
      console.log(`[TrinksService] Cliente criado com ID: ${result.id}`);
      return result.id;
    } catch (error) {
      console.error(`[TrinksService] Erro ao criar cliente:`, error);
      return null;
    }
  }

  /**
   * Lista os serviços disponíveis
   */
  async listServices(searchTerm?: string) {
    try {
      console.log(
        `[TrinksService] Listando serviços${searchTerm ? ` com termo: ${searchTerm}` : ''}`,
      );
      const result = await this.trinksApiService.listServices(searchTerm);
      return result.data;
    } catch (error) {
      console.error(`[TrinksService] Erro ao listar serviços:`, error);
      return [];
    }
  }

  /**
   * Lista os profissionais disponíveis
   */
  async listProfessionals() {
    try {
      console.log(`[TrinksService] Listando profissionais disponíveis`);
      return await this.trinksApiService.listProfessionals();
    } catch (error) {
      console.error(`[TrinksService] Erro ao listar profissionais:`, error);
      return [];
    }
  }

  /**
   * Lista os serviços de um profissional
   */
  async listProfessionalServices(professionalId: number): Promise<any[]> {
    try {
      console.log(
        `[TrinksService] Listando serviços do profissional ID: ${professionalId}`,
      );
      const result =
        await this.trinksApiService.listProfessionalServices(professionalId);
      return result.data;
    } catch (error) {
      console.error(
        `[TrinksService] Erro ao listar serviços do profissional ${professionalId}:`,
        error,
      );
      throw new Error(
        `Erro ao listar serviços do profissional ${professionalId}: ${error.message}`,
      );
    }
  }

  async getProfessionalAvailability(
    professionalId: number,
    date: string,
    servicoId: any,
    estabelecimentoId: number,
    servicoDuracao?: number,
  ): Promise<AvailabilityResponse> {
    try {
      console.log(
        `[TrinksService] Buscando disponibilidade para profissional ${professionalId}, serviço ${servicoId}, data ${date}`,
      );
      const result = await this.trinksApiService.getProfessionalAvailability(
        professionalId,
        date,
        servicoId,
        estabelecimentoId,
        servicoDuracao,
      );
      return result;
    } catch (error) {
      console.error(
        `[TrinksService] Erro ao buscar disponibilidade do profissional ${professionalId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Cria um novo agendamento
   */
  async createAppointment(
    clientId: number,
    professionalId: number,
    serviceId: number,
    durationInMinutes: number,
    price: number,
    startDateTime: string, // ISO format
    notes: string = 'Agendamento via assistente',
  ) {
    try {
      console.log(
        `[TrinksService] Criando agendamento para cliente ID: ${clientId}`,
      );

      const payload = {
        clienteId: clientId,
        profissionalId: professionalId,
        servicoId: serviceId,
        valor: price,
        duracaoEmMinutos: durationInMinutes,
        dataHoraInicio: startDateTime,
        observacoes: notes,
      };

      const result = await this.trinksApiService.createAppointment(payload);
      console.log(`[TrinksService] Agendamento criado com ID: ${result.id}`);
      return result.id;
    } catch (error) {
      console.error(`[TrinksService] Erro ao criar agendamento:`, error);
      return null;
    }
  }

  /**
   * Lista os agendamentos do estabelecimento
   */
  async listAppointments(
    estabelecimentoId: number,
    status?: string,
    clientId?: number,
    professionalId?: number,
    serviceId?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    try {
      console.log(
        `[TrinksService] Listando agendamentos do estabelecimento ID: ${estabelecimentoId}`,
      );

      // Cria objeto com filtros apenas se fornecidos
      const filters: any = {};

      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId;
      if (professionalId) filters.professionalId = professionalId;
      if (serviceId) filters.serviceId = serviceId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await this.trinksApiService.listAppointments(
        estabelecimentoId,
        filters,
      );

      console.log(
        `[TrinksService] Encontrados ${result.data.length} agendamentos`,
      );
      return result.data;
    } catch (error) {
      console.error(`[TrinksService] Erro ao listar agendamentos:`, error);
      return [];
    }
  }
}
