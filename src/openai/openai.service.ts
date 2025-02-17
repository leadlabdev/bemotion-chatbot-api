import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GptService {
  private readonly apiUrl = 'https://sua-api-de-gpt.com/gerar'; // URL da API do GPT

  async getResponse(question: string): Promise<string> {
    try {
      const response = await axios.post(this.apiUrl, { pergunta: question });
      return response.data.resposta;
    } catch (error) {
      console.error('Erro ao chamar GPT:', error.message);
      return 'Desculpe, não consegui entender sua pergunta.';
    }
  }
}
