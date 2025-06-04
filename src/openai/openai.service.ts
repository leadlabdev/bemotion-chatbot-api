import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { GptConfig } from './openai.config';
import { ThreadManager } from './openai.thread-manager';
import { ToolExecutor } from './gpt.tool.executor';
import { ClientCache } from './client.cache';
import { SessionService } from '@/chatbot/services/session.service';

export interface ThreadState {
  serviceSelected?: string;
  serviceId?: number;
  professionalId?: number;
  stage: string;
  clientId?: number;
  clientName?: string;
}

@Injectable()
export class GptService {
  private readonly logger = new Logger(GptService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly gptConfig: GptConfig,
    private readonly threadManager: ThreadManager,
    private readonly toolExecutor: ToolExecutor,
    private readonly clientCache: ClientCache,
    private readonly sessionService: SessionService,
  ) {
    this.openai = new OpenAI({ apiKey: gptConfig.apiKey });
  }

  async generateResponse(
    message: string,
    userId: string,
    session: any,
  ): Promise<string> {
    try {
      this.logger.log(
        `Iniciando generateResponse: userId=${userId}, message="${message}"`,
      );

      if (!message || typeof message !== 'string') {
        this.logger.warn('Mensagem inválida ou ausente');
        return this.getDefaultGreeting(session?.telefone);
      }

      const phone = session?.telefone;
      const clientName = await this.clientCache.getClientName(phone);
      const threadData = await this.threadManager.getOrCreateThread(userId);

      // Aguarda conclusão de run ativo, se houver
      if (session.lastRunId && session.threadId === threadData.threadId) {
        await this.waitForRunCompletion(threadData.threadId, session.lastRunId);
      }

      // Adiciona histórico de mensagens ao thread
      session.messages = session.messages || [];
      for (const msg of session.messages) {
        await this.openai.beta.threads.messages.create(threadData.threadId, {
          role: msg.role,
          content: this.buildEnhancedMessage(
            msg.content,
            clientName,
            phone,
            threadData.state,
          ),
        });
      }

      // Cria um novo run
      const run = await this.openai.beta.threads.runs.create(
        threadData.threadId,
        { assistant_id: this.gptConfig.assistantId },
      );
      this.logger.log(`Run criado: runId=${run.id}`);

      // Salva o runId e threadId na sessão
      session.lastRunId = run.id;
      session.threadId = threadData.threadId;
      await this.sessionService.updateSession(userId, session);

      const completedRun = await this.handleRun(threadData.threadId, run.id);

      if (completedRun.status !== 'completed') {
        this.logger.warn(`Run não concluído: status=${completedRun.status}`);
        if (completedRun.last_error) {
          this.logger.error(
            `Erro no run: ${JSON.stringify(completedRun.last_error)}`,
          );
        }
        return this.getDefaultGreeting(phone, threadData.state);
      }

      const response = await this.getLatestResponse(
        threadData.threadId,
        phone,
        threadData.state,
      );

      // Limpa o lastRunId após conclusão
      session.lastRunId = null;
      await this.sessionService.updateSession(userId, session);

      return response;
    } catch (error) {
      this.logger.error('Erro ao gerar resposta', error);
      return this.getDefaultGreeting(
        session?.telefone,
        this.threadManager.getThreadState(userId),
      );
    }
  }

  private async waitForRunCompletion(threadId: string, runId: string) {
    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    const pendingStatuses = ['queued', 'in_progress', 'requires_action'];
    let attempts = 0;
    const maxAttempts = 60; // Aumentar para 60 tentativas (60 segundos)

    while (pendingStatuses.includes(run.status) && attempts < maxAttempts) {
      this.logger.debug(
        `Aguardando run: status=${run.status}, tentativa=${attempts + 1}`,
      );
      if (run.status === 'requires_action' && run.required_action) {
        await this.handleRequiredAction(threadId, runId, run.required_action);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      this.logger.error(`Máximo de tentativas atingido: status=${run.status}`);
    } else if (run.status === 'failed') {
      this.logger.error(`Run falhou: ${JSON.stringify(run.last_error)}`);
    }
  }

  private buildEnhancedMessage(
    message: string,
    clientName: string,
    phone: string | undefined,
    state: ThreadState,
  ): string {
    const currentDate = new Date().toISOString().split('T')[0];
    return `[Contexto: Nome do cliente: ${clientName}, Telefone: ${phone || 'desconhecido'}, Data atual: ${currentDate}, Estado: ${JSON.stringify(state)}]\n${message}`;
  }

  private async handleRun(threadId: string, runId: string) {
    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    const pendingStatuses = ['queued', 'in_progress', 'requires_action'];
    let attempts = 0;
    const maxAttempts = 60; // Aumentar para 60 tentativas (60 segundos)

    while (pendingStatuses.includes(run.status) && attempts < maxAttempts) {
      this.logger.debug(
        `Status do run: ${run.status}, tentativa: ${attempts + 1}`,
      );

      if (run.status === 'requires_action' && run.required_action) {
        await this.handleRequiredAction(threadId, runId, run.required_action);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      this.logger.error(`Máximo de tentativas atingido: status=${run.status}`);
    } else if (run.status === 'failed') {
      this.logger.error(`Run falhou: ${JSON.stringify(run.last_error)}`);
    }

    this.logger.log(`Run concluído com status: ${run.status}`);
    return run;
  }

  private async handleRequiredAction(
    threadId: string,
    runId: string,
    requiredAction: any,
  ) {
    const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
    this.logger.debug(`Tool calls recebidos: ${JSON.stringify(toolCalls)}`);

    if (toolCalls.length === 0) {
      this.logger.warn('Nenhum tool call recebido');
      return;
    }

    const toolOutputs = await Promise.all(
      toolCalls.map(async (toolCall: any) => {
        this.logger.debug(`Processando tool call: ${toolCall.function.name}`);
        try {
          const args = JSON.parse(toolCall.function.arguments);
          const output = await this.toolExecutor.execute(
            toolCall.function.name,
            args,
            threadId,
          );
          return { tool_call_id: toolCall.id, output: JSON.stringify(output) };
        } catch (error) {
          this.logger.error(
            `Erro ao executar função ${toolCall.function.name}: ${error.message}`,
          );
          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              error: `Erro ao executar função: ${error.message}`,
            }),
          };
        }
      }),
    );

    if (toolOutputs.length > 0) {
      this.logger.debug(
        `Submetendo tool outputs: ${JSON.stringify(toolOutputs)}`,
      );
      await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: toolOutputs,
      });
    }
  }

  private async getLatestResponse(
    threadId: string,
    phone?: string,
    state?: ThreadState,
  ): Promise<string> {
    const messages = await this.openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data
      .filter((msg) => msg.role === 'assistant')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    if (assistantMessages.length === 0) {
      this.logger.warn('Nenhuma mensagem do assistente encontrada');
      return this.getDefaultGreeting(phone, state);
    }

    const responseContent = assistantMessages[0].content[0];
    if (!responseContent || responseContent.type !== 'text') {
      this.logger.warn('Resposta do assistente não contém texto');
      return this.getDefaultGreeting(phone, state);
    }

    this.logger.log(`Resposta do assistente: ${responseContent.text.value}`);
    return responseContent.text.value;
  }

  private async getDefaultGreeting(
    phone?: string,
    state?: ThreadState,
  ): Promise<string> {
    const clientName = phone
      ? await this.clientCache.getClientName(phone)
      : 'Cliente';

    if (state?.serviceSelected) {
      return `Olá ${clientName}, parece que estávamos falando sobre ${state.serviceSelected}! 😊 Quer continuar com esse serviço ou prefere outro procedimento?`;
    }

    return `Olá ${clientName}, tudo bem? Sou a Bia do Mega Studio Normandia! 😊 Qual procedimento você está precisando hoje?`;
  }
}
