import { Injectable, Logger } from '@nestjs/common';
import { TrinksService } from '../trinks/trinks.service';

@Injectable()
export class ClientCache {
  private readonly logger = new Logger(ClientCache.name);
  private readonly cache: Map<string, { nome: string; id: number }> = new Map();

  constructor(private readonly trinksService: TrinksService) {}

  async getClientName(phone: string | undefined): Promise<string> {
    if (!phone) return 'Cliente';
    const cached = this.cache.get(phone);
    if (cached) {
      this.logger.debug(`Nome do cliente obtido do cache: ${cached.nome}`);
      return cached.nome;
    }
    try {
      const clientData = await this.trinksService.checkClientByPhone(phone);
      const nome = clientData?.data?.[0]?.nome?.split(' ')[0] || 'Cliente';
      this.cache.set(phone, { nome, id: clientData?.data?.[0]?.id });
      return nome;
    } catch (error) {
      this.logger.error('Erro ao verificar cliente', error);
      return 'Cliente';
    }
  }
}
