import { Injectable } from '@nestjs/common';
import {
  Client,
  CreateClientPayload,
  TrinksApiService,
} from './trinks.api.service';

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
  async listAvailableProfessionals() {
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
  async listProfessionalServices(professionalId: number) {
    try {
      console.log(
        `[TrinksService] Listando serviços do profissional ID: ${professionalId}`,
      );
      const result =
        await this.trinksApiService.listProfessionalServices(professionalId);
      return result.data;
    } catch (error) {
      console.error(
        `[TrinksService] Erro ao listar serviços do profissional:`,
        error,
      );
      return [];
    }
  }

  /**
   * Lista os horários disponíveis de um profissional em uma data específica
   * @param professionalId ID do profissional
   * @param date Data no formato YYYY-MM-DD
   */
  async getProfessionalAvailability(professionalId: number, date: string) {
    try {
      console.log(
        `[TrinksService] Consultando disponibilidade do profissional ID: ${professionalId} na data: ${date}`,
      );
      const result = await this.trinksApiService.listProfessionalAvailability(
        professionalId,
        date,
      );

      if (result.data.length === 0) {
        console.log(`[TrinksService] Nenhuma disponibilidade encontrada`);
        return { horariosVagos: [], intervalosVagos: [] };
      }

      return {
        horariosVagos: result.data[0].horariosVagos,
        intervalosVagos: result.data[0].intervalosVagos,
      };
    } catch (error) {
      console.error(
        `[TrinksService] Erro ao consultar disponibilidade:`,
        error,
      );
      return { horariosVagos: [], intervalosVagos: [] };
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
