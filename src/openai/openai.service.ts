import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class GptService {
  private openai: OpenAI;
  private assistantId: string = 'asst_wfI9H5irkU3QLxF2zfRz2gAh';
  private threadCache: Map<string, string> = new Map();

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateResponse(
    telefone: string,
    messageContext: any = {},
    userId: string,
  ): Promise<string> {
    try {
      // Gerenciar thread para o usuário
      let threadId = this.threadCache.get(userId);
      if (!threadId) {
        const thread = await this.openai.beta.threads.create();
        threadId = thread.id;
        this.threadCache.set(userId, threadId);
      }

      let messageContent = messageContext.mensagem;

      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: messageContent,
      });

      // Executar o assistente
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
      });

      // Aguardar a conclusão da execução
      const completedRun = await this.waitForRunCompletion(threadId, run.id);

      if (completedRun.status !== 'completed') {
        return `Erro: O assistente retornou com status ${completedRun.status}`;
      }

      // Obter a resposta mais recente
      const messages = await this.openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data
        .filter((msg) => msg.role === 'assistant')
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

      if (assistantMessages.length === 0) {
        return 'Não foi possível obter uma resposta do assistente.';
      }

      const responseContent = assistantMessages[0].content[0];
      if (responseContent.type === 'text') {
        return responseContent.text.value;
      }

      return 'A resposta do assistente não contém texto.';
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      return 'Ocorreu um erro ao processar sua solicitação.';
    }
  }

  private async waitForRunCompletion(threadId: string, runId: string) {
    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    const pendingStatuses = ['queued', 'in_progress'];
    let attempts = 0;
    const maxAttempts = 30;

    while (pendingStatuses.includes(run.status) && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    return run;
  }
}
