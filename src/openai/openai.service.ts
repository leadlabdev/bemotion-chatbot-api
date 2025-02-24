import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class GptService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.GPT_API_KEY,
    });
  }

  async getResponse(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      return response.choices[0]?.message?.content || 'Erro ao gerar resposta';
    } catch (error) {
      console.error('Erro ao chamar OpenAI:', error);
      return 'Ocorreu um erro ao processar sua solicitação.';
    }
  }
}
