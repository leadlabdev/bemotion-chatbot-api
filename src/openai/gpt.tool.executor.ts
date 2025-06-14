import { Injectable, Logger } from '@nestjs/common';
import { TrinksService } from '../trinks/trinks.service';
import { ThreadManager } from './openai.thread-manager';
import { ThreadState } from './openai.service';

@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  constructor(
    private readonly trinksService: TrinksService,
    private readonly threadManager: ThreadManager,
  ) {}

  async execute(
    functionName: string,
    args: any,
    threadId: string,
  ): Promise<any> {
    const threadData = Array.from(
      this.threadManager['threadCache'].values(),
    ).find((data) => data.threadId === threadId);
    const state = threadData?.state;

    switch (functionName) {
      case 'checkClientByPhone':
        return await this.trinksService.checkClientByPhone(args.phone);

      case 'createClient':
        return {
          id: await this.trinksService.createClient(
            args.name,
            args.phone,
            args.gender,
          ),
        };

      case 'listServices':
        return await this.handleListServices(args, state);

      case 'listAppointments':
        return await this.handleListAppointments(args, state);

      case 'listProfessionals':
        return await this.listProfessionals(state, args.date);

      case 'listProfessionalServices':
        return await this.handleListProfessionalServices(args, state);

      case 'getProfessionalAvailability':
        return await this.handleGetProfessionalAvailability(args, state);

      case 'createAppointment':
        return await this.createAppointment(args, state);

      default:
        return { error: 'Unknown function' };
    }
  }

  private async handleListServices(
    args: { searchTerm?: string; selectedServiceId?: number },
    state?: ThreadState,
  ) {
    const searchTerm = args.searchTerm?.toLowerCase() || '';
    const services = await this.trinksService.listServices();
    return { services };
  }

  private async handleListProfessionalServices(
    args: { serviceId: number },
    state?: ThreadState,
  ) {
    const services = await this.trinksService.listProfessionalsByService(
      args.serviceId,
    );
    return { services };
  }

  private async listProfessionals(state?: ThreadState, date?: string) {
    const professionals = await this.trinksService.listProfessionals();
    return { professionals };
  }

  private async handleGetProfessionalAvailability(
    args: {
      professionalId: number;
      date: string;
      estabelecimentoId?: number;
      servicoId?: number;
    },
    state?: ThreadState,
  ) {
    const desiredServiceId = args.servicoId || state?.serviceId;

    try {
      console.log(
        `[ToolExecutor] Buscando disponibilidade com parâmetros: ${JSON.stringify(args)}`,
      );

      const availability = await this.trinksService.getProfessionalAvailability(
        args.professionalId,
        args.date,
        desiredServiceId,
        args.estabelecimentoId || 54027,
      );

      // Log da resposta completa
      console.log(
        `[ToolExecutor] Disponibilidade recebida: ${JSON.stringify(availability)}`,
      );

      // Verifica se há horários disponíveis
      if (availability.horariosVagos && availability.horariosVagos.length > 0) {
        return {
          availableSlots: availability.horariosVagos,
          intervals: availability.intervalosVagos || [],
        };
      } else {
        return { availableSlots: [] };
      }
    } catch (error) {
      console.error(`[ToolExecutor] Erro ao buscar disponibilidade: ${error}`);
      return { error: error.message, availableSlots: [] };
    }
  }

  private async createAppointment(args: any, state?: ThreadState) {
    const appointmentId = await this.trinksService.createAppointment(
      args.clientId,
      args.professionalId,
      args.serviceId,
      args.durationInMinutes,
      args.price,
      args.startDateTime,
      args.notes,
    );
    return { appointmentId };
  }

  private async handleListAppointments(
    args: {
      estabelecimentoId: number;
      status?: string;
      clientId?: number;
      professionalId?: number;
      serviceId?: number;
      startDate?: string;
      endDate?: string;
    },
    state?: ThreadState,
  ) {
    const appointments = await this.trinksService.listAppointments(
      args.estabelecimentoId || 54027,
      args.status,
      args.clientId,
      args.professionalId,
      args.serviceId,
      args.startDate,
      args.endDate,
    );
    return { appointments };
  }
}
