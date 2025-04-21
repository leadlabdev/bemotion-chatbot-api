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
    prompt: string,
    messageContext: any = {},
    userId: string,
  ): Promise<string> {
    try {
      // Log 1: Entrada do método generateResponse
      console.log('GptService.generateResponse - Entrada:', {
        userId,
        prompt,
        messageContext,
      });

      // Gerenciar thread
      let threadId = this.threadCache.get(userId);
      if (!threadId) {
        const thread = await this.openai.beta.threads.create();
        threadId = thread.id;
        this.threadCache.set(userId, threadId);
        // Log 2: Criação de novo thread
        console.log('GptService.generateResponse - Novo thread criado:', {
          userId,
          threadId,
        });
      } else {
        // Log 3: Reutilização de thread existente
        console.log('GptService.generateResponse - Thread reutilizado:', {
          userId,
          threadId,
        });
      }

      // Enriquecer prompt com contexto
      const enrichedPrompt = this.enrichPromptWithContext(
        prompt,
        messageContext,
      );
      // Log 4: Prompt enriquecido
      console.log('GptService.generateResponse - Prompt enriquecido:', {
        userId,
        enrichedPrompt,
      });

      // Criar mensagem no thread
      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: enrichedPrompt,
      });
      // Log 5: Mensagem enviada ao thread
      console.log('GptService.generateResponse - Mensagem enviada ao thread:', {
        userId,
        threadId,
        enrichedPrompt,
      });

      // Criar run
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
      });
      // Log 6: Run criado
      console.log('GptService.generateResponse - Run criado:', {
        userId,
        threadId,
        runId: run.id,
        status: run.status,
      });

      // Aguardar conclusão do run
      const completedRun = await this.waitForRunCompletion(threadId, run.id);
      // Log 7: Status do run após conclusão
      console.log('GptService.generateResponse - Run concluído:', {
        userId,
        threadId,
        runId: completedRun.id,
        status: completedRun.status,
      });

      if (completedRun.status !== 'completed') {
        console.warn('GptService.generateResponse - Run não completado:', {
          userId,
          threadId,
          status: completedRun.status,
        });
        return `Erro: O assistente retornou com status ${completedRun.status}`;
      }

      // Obter mensagens do thread
      const messages = await this.openai.beta.threads.messages.list(threadId);
      const assistantMessages = messages.data
        .filter((msg) => msg.role === 'assistant')
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

      // Log 8: Mensagens do assistente obtidas
      console.log('GptService.generateResponse - Mensagens do assistente:', {
        userId,
        threadId,
        assistantMessagesCount: assistantMessages.length,
        assistantMessages: assistantMessages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
        })),
      });

      if (assistantMessages.length === 0) {
        console.warn(
          'GptService.generateResponse - Nenhuma mensagem de assistente encontrada:',
          {
            userId,
            threadId,
          },
        );
        return 'Não foi possível obter uma resposta do assistente.';
      }

      const responseContent = assistantMessages[0].content[0];
      if (responseContent.type === 'text') {
        // Log 9: Resposta final
        console.log('GptService.generateResponse - Resposta final:', {
          userId,
          threadId,
          response: responseContent.text.value,
        });
        return responseContent.text.value;
      }

      console.warn('GptService.generateResponse - Resposta não contém texto:', {
        userId,
        threadId,
        responseContent,
      });
      return 'A resposta do assistente não contém texto.';
    } catch (error) {
      console.error('GptService.generateResponse - Erro:', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      return 'Ocorreu um erro ao processar sua solicitação.';
    }
  }

  private async waitForRunCompletion(threadId: string, runId: string) {
    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    const pendingStatuses = ['queued', 'in_progress'];
    let attempts = 0;
    const maxAttempts = 30;

    // Log 10: Início da espera pelo run
    console.log('GptService.waitForRunCompletion - Início:', {
      threadId,
      runId,
      status: run.status,
    });

    while (pendingStatuses.includes(run.status) && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
      // Log 11: Status durante a espera
      console.log('GptService.waitForRunCompletion - Verificação:', {
        threadId,
        runId,
        status: run.status,
        attempts,
      });
    }

    // Log 12: Fim da espera
    console.log('GptService.waitForRunCompletion - Fim:', {
      threadId,
      runId,
      status: run.status,
      attempts,
    });

    return run;
  }

  private enrichPromptWithContext(prompt: string, context: any): string {
    if (!context || Object.keys(context).length === 0) {
      // Log 13: Contexto vazio
      console.log('GptService.enrichPromptWithContext - Contexto vazio:', {
        prompt,
      });
      return prompt;
    }

    let enrichedPrompt = `Instruções: ${prompt}\n\nContexto da conversa:\n`;
    if (context.nome) {
      enrichedPrompt += `Nome do cliente: ${context.nome}\n`;
    }
    if (context.conversationStage) {
      enrichedPrompt += `Estágio da conversa: ${context.conversationStage}\n`;
    }
    if (context.previousMessages) {
      enrichedPrompt += `Histórico de mensagens:\n${context.previousMessages.join('\n')}\n`;
    }

    // Log 14: Contexto enriquecido
    console.log('GptService.enrichPromptWithContext - Contexto aplicado:', {
      prompt,
      context,
      enrichedPrompt,
    });

    return enrichedPrompt;
  }
}
