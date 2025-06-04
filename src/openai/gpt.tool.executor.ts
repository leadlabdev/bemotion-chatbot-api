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
    this.logger.log(
      `Executando função: ${functionName}, args: ${JSON.stringify(args)}`,
    );

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
        const services = await this.trinksService.listServices(args.searchTerm);
        if (state && services?.length > 0) {
          state.stage = 'servico_selecionado';
          if (args.selectedServiceId) {
            const selectedService = services.find(
              (s) => s.id === args.selectedServiceId,
            );
            if (selectedService) {
              state.serviceId = selectedService.id;
              state.serviceSelected = selectedService.nome;
              this.logger.log(
                `Serviço selecionado: ID=${state.serviceId}, Nome=${state.serviceSelected}`,
              );
            }
          } else if (services.length === 1) {
            state.serviceId = services[0].id;
            state.serviceSelected = services[0].nome;
            this.logger.log(
              `Serviço selecionado automaticamente: ID=${state.serviceId}, Nome=${state.serviceSelected}`,
            );
          } else {
            state.serviceId = services[0].id;
            state.serviceSelected = services[0].nome;
            this.logger.log(
              `Serviço padrão selecionado: ID=${state.serviceId}, Nome=${state.serviceSelected}`,
            );
          }
        }
        return { services };

      case 'listAvailableProfessionals':
        return await this.listAvailableProfessionals(state, args.date);

      case 'listProfessionalServices':
        const servicesResponse =
          await this.trinksService.listProfessionalServices(
            args.professionalId,
          );
        this.logger.log(
          `Retornando serviços do profissional ${args.professionalId}: ${JSON.stringify(servicesResponse)}`,
        );
        return { services: servicesResponse || [] };

      case 'getProfessionalAvailability':
        return await this.getProfessionalAvailability(args, state);

      case 'createAppointment':
        return await this.createAppointment(args, state);

      default:
        this.logger.warn(`Função desconhecida: ${functionName}`);
        return { error: 'Unknown function' };
    }
  }

  private async listAvailableProfessionals(state?: ThreadState, date?: string) {
    this.logger.debug('Iniciando listagem de profissionais disponíveis');

    if (!state?.serviceId) {
      this.logger.warn('Nenhum serviceId definido no estado');
      return {
        error:
          'Nenhum serviço selecionado. Por favor, escolha um serviço primeiro.',
      };
    }

    // Obter todos os profissionais
    let professionals = await this.trinksService.listAvailableProfessionals();
    this.logger.debug(
      `Profissionais encontrados inicialmente: ${professionals.length}`,
    );

    // Filtrar profissionais que oferecem o serviço selecionado
    professionals = await Promise.all(
      professionals.map(async (professional: any) => {
        try {
          const services = await this.trinksService.listProfessionalServices(
            professional.id,
          );
          this.logger.debug(
            `Serviços do profissional ${professional.id}: ${JSON.stringify(services)}`,
          );
          const offersService = services?.some(
            (s: any) => Number(s.id) === Number(state.serviceId),
          );
          this.logger.debug(
            `Profissional ${professional.id} ${offersService ? 'oferece' : 'não oferece'} o serviço ${state.serviceId}`,
          );

          // Se o profissional não oferece o serviço, descartá-lo
          if (!offersService) {
            return null;
          }

          // Verificar disponibilidade para a data fornecida (ou data atual se não fornecida)
          const availabilityDate =
            date || new Date().toISOString().split('T')[0];
          const availability =
            await this.trinksService.getProfessionalAvailability(
              professional.id,
              availabilityDate,
            );
          this.logger.debug(
            `Disponibilidade do profissional ${professional.id} na data ${availabilityDate}: ${JSON.stringify(availability)}`,
          );

          // Se o profissional não tem horários disponíveis, descartá-lo
          if (!availability.horariosVagos?.length) {
            this.logger.debug(
              `Profissional ${professional.id} sem horários disponíveis na data ${availabilityDate}`,
            );
            return null;
          }

          // Retornar profissional com horários disponíveis
          return {
            ...professional,
            availableSlots: availability.horariosVagos,
          };
        } catch (error) {
          this.logger.error(
            `Erro ao verificar serviços ou disponibilidade do profissional ${professional.id}: ${error.message}`,
          );
          return null;
        }
      }),
    );

    // Remover profissionais nulos (filtrados por não oferecerem o serviço ou não terem disponibilidade)
    professionals = professionals.filter((p) => p !== null);
    this.logger.log(`Profissionais filtrados: ${professionals.length}`);

    if (professionals.length === 0) {
      this.logger.warn(
        `Nenhum profissional disponível para o serviço ${state.serviceId} (${state.serviceSelected}) na data fornecida`,
      );
      return {
        error: `Desculpe, no momento não temos profissionais disponíveis para o serviço ${state.serviceSelected}. Tente outra data ou serviço.`,
      };
    }

    // Atualizar o estado para indicar que profissionais foram selecionados
    if (state) {
      state.stage = 'profissional_selecionado';
    }

    this.logger.debug(
      `Profissionais filtrados com disponibilidade: ${JSON.stringify(professionals)}`,
    );
    return { professionals };
  }

  private async getProfessionalAvailability(args: any, state?: ThreadState) {
    if (state?.professionalId && state?.serviceId) {
      const services = await this.trinksService.listProfessionalServices(
        state.professionalId,
      );
      if (!services?.some((s: any) => s.id === state.serviceId)) {
        this.logger.error(
          `Profissional ${state.professionalId} não oferece o serviço ${state.serviceId}`,
        );
        return { error: 'Profissional não oferece o serviço selecionado' };
      }
    }
    const availability = await this.trinksService.getProfessionalAvailability(
      args.professionalId,
      args.date,
    );
    if (state && availability.horariosVagos?.length > 0) {
      state.stage = 'horario_selecionado';
      state.professionalId = args.professionalId;
    }
    return availability;
  }

  private async createAppointment(args: any, state?: ThreadState) {
    if (state?.serviceId && state?.professionalId) {
      const services = await this.trinksService.listProfessionalServices(
        state.professionalId,
      );
      if (!services?.some((s: any) => s.id === state.serviceId)) {
        this.logger.error(
          `Tentativa de criar agendamento com profissional ${state.professionalId} que não oferece o serviço ${state.serviceId}`,
        );
        return { error: 'Profissional não oferece o serviço selecionado' };
      }
    }
    try {
      const appointmentId = await this.trinksService.createAppointment(
        args.clientId,
        args.professionalId,
        args.serviceId,
        args.durationInMinutes,
        args.price,
        args.startDateTime,
        args.notes,
      );
      if (state) {
        state.stage = 'agendamento_confirmado';
      }
      return { appointmentId };
    } catch (error: any) {
      this.logger.error('Erro ao criar agendamento', error);
      if (error.response?.status === 400) {
        return {
          error:
            'Erro 400: Profissional ou serviço inválido para este agendamento',
        };
      }
      return { error: 'Erro ao criar agendamento' };
    }
  }
}
