import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GptConfig {
  public readonly apiKey: string;
  public readonly assistantId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.getConfigOrThrow('OPENAI_API_KEY');
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    this.assistantId =
      nodeEnv === 'production'
        ? this.getConfigOrThrow('OPENAI_ASSISTANT_ID_PROD')
        : this.getConfigOrThrow('OPENAI_ASSISTANT_ID_DEV');
    this.validateConfigurations();
  }

  private getConfigOrThrow(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Configuração obrigatória "${key}" não encontrada.`);
    }
    return value;
  }

  private validateConfigurations() {
    const requiredConfigs = [
      'OPENAI_API_KEY',
      this.configService.get<string>('NODE_ENV') === 'production'
        ? 'OPENAI_ASSISTANT_ID_PROD'
        : 'OPENAI_ASSISTANT_ID_DEV',
    ];
    for (const config of requiredConfigs) {
      this.getConfigOrThrow(config);
    }
  }
}
