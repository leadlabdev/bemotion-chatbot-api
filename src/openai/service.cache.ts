import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrinksService } from '../trinks/trinks.service';

@Injectable()
export class ServiceCache {
  private readonly logger = new Logger(ServiceCache.name);
  private readonly cache: Map<string, any[]> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly trinksService: TrinksService,
  ) {}

  async getServices(searchTerm: string): Promise<any[]> {
    const cacheKey = `${searchTerm}:${this.configService.get('TRINKS_ESTABELECIMENTO_ID')}`;
    let services = this.cache.get(cacheKey);
    if (!services) {
      this.logger.log(`Buscando serviços para ${searchTerm} na API`);
      services = await this.trinksService.listServices(searchTerm);
      this.cache.set(cacheKey, services);
    } else {
      this.logger.debug(`Serviços obtidos do cache para ${searchTerm}`);
    }
    return services.filter((s) => s.visivelParaCliente);
  }
}
