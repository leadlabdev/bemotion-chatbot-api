import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private redisService: Redis;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor() {
    this.redisService = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
      automaticDeserialization: false,
    });
  }

  async onModuleInit() {
    try {
      await this.redisService.ping();
      this.isConnected = true;
      this.logger.log('Conexão com Redis estabelecida com sucesso');
    } catch (error) {
      this.logger.error('Falha ao conectar ao Redis', error);
      this.isConnected = false;
    }
  }

  get client(): Redis {
    return this.redisService;
  }

  private validateValue(value: any, key: string): boolean {
    if (value === null || value === undefined) {
      this.logger.warn(
        `Tentativa de salvar valor nulo/undefined para chave ${key}`,
      );
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (
        !serialized ||
        serialized === '[object Object]' ||
        serialized === 'undefined'
      ) {
        this.logger.error(
          `Valor não pode ser serializado adequadamente para chave ${key}:`,
          value,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Erro na validação de serialização para chave ${key}:`,
        error,
      );
      return false;
    }
  }

  private normalizeValue(value: any): string | null {
    if (typeof value === 'string') {
      return value;
    }

    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (error) {
        this.logger.error(
          'Erro ao serializar objeto retornado do Redis:',
          error,
        );
        return null;
      }
    }

    return String(value);
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis não está conectado, operação set ignorada');
        return false;
      }

      if (!this.validateValue(value, key)) {
        return false;
      }

      const serializedValue = JSON.stringify(value);

      this.logger.debug(
        `Salvando no Redis: chave=${key}, valor=${serializedValue.substring(0, 200)}${serializedValue.length > 200 ? '...' : ''}`,
      );

      if (ttlSeconds && ttlSeconds > 0) {
        await this.redisService.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.redisService.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      this.logger.error(`Erro ao definir chave ${key} no Redis:`, error);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis não está conectado, retornando null');
        return null;
      }

      let rawValue: any;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          rawValue = await this.redisService.get(key);
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          this.logger.warn(
            `Tentativa ${attempts} falhou para chave ${key}, tentando novamente...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
        }
      }

      if (rawValue === null || rawValue === undefined) {
        this.logger.debug(`Chave ${key} não encontrada no Redis`);
        return null;
      }

      this.logger.debug(
        `Tipo de valor recebido para ${key}: ${typeof rawValue}`,
      );

      const normalizedValue = this.normalizeValue(rawValue);

      if (normalizedValue === null) {
        this.logger.error(
          `Não foi possível normalizar valor para chave ${key}`,
        );
        await this.delete(key);
        return null;
      }

      if (
        normalizedValue === '[object Object]' ||
        normalizedValue.startsWith('[object')
      ) {
        this.logger.error(
          `Valor corrompido encontrado para chave ${key}: ${normalizedValue}`,
        );
        await this.delete(key);
        return null;
      }

      if (normalizedValue.startsWith('{') || normalizedValue.startsWith('[')) {
        try {
          const parsedValue = JSON.parse(normalizedValue);
          this.logger.debug(`Recuperado do Redis: chave=${key}`);
          return parsedValue as T;
        } catch (parseError) {
          this.logger.error(
            `Erro ao fazer parse do JSON para chave ${key}:`,
            parseError,
          );
          this.logger.debug(
            `Valor problemático: ${normalizedValue.substring(0, 500)}`,
          );
          await this.delete(key);
          return null;
        }
      }

      this.logger.debug(`Recuperado valor string do Redis: chave=${key}`);
      return normalizedValue as T;
    } catch (error) {
      this.logger.error(`Erro ao obter chave ${key} do Redis:`, error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis não está conectado, operação delete ignorada');
        return false;
      }

      await this.redisService.del(key);
      this.logger.log(`Chave ${key} removida do Redis`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao remover chave ${key} do Redis:`, error);
      return false;
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.redisService.ping();
      this.isConnected = true;
      return true;
    } catch (error) {
      this.logger.error('Erro no ping do Redis:', error);
      this.isConnected = false;
      return false;
    }
  }
}
