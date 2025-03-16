import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class GptService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(
    prompt: string,
    messageContext: any = {},
  ): Promise<string> {
    try {
      // Enriquecer o prompt com o contexto
      const enrichedPrompt = this.enrichPromptWithContext(
        prompt,
        messageContext,
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente virtual para um salão de beleza, responsável por atendimento e agendamentos. Seja cordial, profissional e conciso nas respostas.',
          },
          {
            role: 'user',
            content: enrichedPrompt,
          },
        ],
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || 'Erro ao gerar resposta';
    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error);
      return 'Ocorreu um erro ao processar sua solicitação.';
    }
  }

  private enrichPromptWithContext(prompt: string, context: any): string {
    // Se não houver contexto, retorna o prompt original
    if (!context || Object.keys(context).length === 0) {
      return prompt;
    }

    // Concatena o contexto ao prompt
    let enrichedPrompt = prompt + '\n\nContexto adicional:';

    for (const [key, value] of Object.entries(context)) {
      enrichedPrompt += `\n- ${key}: ${value}`;
    }

    return enrichedPrompt;
  }
}
