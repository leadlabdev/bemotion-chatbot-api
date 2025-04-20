import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class GptService {
  private openai: OpenAI;
  private assistantId: string = 'asst_wfI9H5irkU3QLxF2zfRz2gAh';

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

      // Criar um thread
      const thread = await this.openai.beta.threads.create();

      // Adicionar a mensagem ao thread
      await this.openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: enrichedPrompt,
      });

      // Executar o assistente no thread
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistantId,
      });

      // Verificar o status do run até que esteja completo
      const completedRun = await this.waitForRunCompletion(thread.id, run.id);

      if (completedRun.status !== 'completed') {
        return `Erro: O assistente retornou com status ${completedRun.status}`;
      }

      // Obter as mensagens do thread
      const messages = await this.openai.beta.threads.messages.list(thread.id);

      // Obter a resposta do assistente (a mensagem mais recente do assistente)
      const assistantMessages = messages.data
        .filter((msg) => msg.role === 'assistant')
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

      if (assistantMessages.length === 0) {
        return 'Não foi possível obter uma resposta do assistente.';
      }

      // Extrair o conteúdo da mensagem
      const responseContent = assistantMessages[0].content[0];
      if (responseContent.type === 'text') {
        return responseContent.text.value;
      } else {
        return 'A resposta do assistente não contém texto.';
      }
    } catch (error) {
      console.error('Erro ao chamar OpenAI Assistant:', error);
      return 'Ocorreu um erro ao processar sua solicitação.';
    }
  }

  private async waitForRunCompletion(threadId: string, runId: string) {
    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId);

    // Status que indicam que o run ainda está em andamento
    const pendingStatuses = ['queued', 'in_progress'];

    // Esperar enquanto o run estiver em andamento (máximo de 30 tentativas)
    let attempts = 0;
    const maxAttempts = 30;

    while (pendingStatuses.includes(run.status) && attempts < maxAttempts) {
      // Esperar 1 segundo antes de verificar novamente
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Buscar o status atualizado
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    return run;
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
