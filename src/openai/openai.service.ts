import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GptService {
  private readonly apiUrl = 'https://api.openai.com/v1/completions';
  private readonly apiKey = process.env.GPT_API_KEY;

  async getResponse(message: string): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'text-davinci-003',
          prompt: message,
          max_tokens: 150,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );
      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error('Erro ao obter resposta do GPT:', error);
      return 'Desculpe, houve um erro ao processar sua mensagem.';
    }
  }
}
