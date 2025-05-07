import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TrinksService } from '../trinks/trinks.service';

@Injectable()
export class GptService {
  private openai: OpenAI;
  private assistantId: any;
  private threadCache: Map<string, string> = new Map();

  constructor(
    private configService: ConfigService,
    private trinksService: TrinksService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.assistantId = this.configService.get<string>('OPENAI_ASSISTANT_ID');
    if (!this.assistantId) {
      throw new Error('OPENAI_ASSISTANT_ID is not defined in environment');
    }
  }

  async generateResponse(
    message: string,
    userId: string,
    session: any,
  ): Promise<string> {
    try {
      console.log(
        `[GptService] Iniciando generateResponse: userId=${userId}, message="${message}", session=`,
        session,
      );

      // Validate message
      if (!message || typeof message !== 'string') {
        console.log(`[GptService] Mensagem inválida ou ausente`);
        return 'Desculpe, não entendi sua mensagem. 😊 Pode mandar novamente?';
      }

      // Gerenciar thread para o usuário
      let threadId = this.threadCache.get(userId);
      if (!threadId) {
        const thread = await this.openai.beta.threads.create();
        threadId = thread.id;
        this.threadCache.set(userId, threadId);
        console.log(`[GptService] Nova thread criada: threadId=${threadId}`);
      }

      // Enviar mensagem com contexto
      const phone = session?.telefone;
      const enhancedMessage = `[Contexto: Nome do cliente: Cliente, Telefone: ${phone || 'desconhecido'}]\n${message}`;
      console.log(
        `[GptService] Mensagem enviada ao assistente: ${enhancedMessage}`,
      );

      await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: enhancedMessage,
      });

      // Executar o assistente
      const run = await this.openai.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
      });
      console.log(`[GptService] Run criado: runId=${run.id}`);

      // Aguardar a conclusão da execução
      const completedRun = await this.handleRun(threadId, run.id);

      if (completedRun.status !== 'completed') {
        console.log(
          `[GptService] Run não concluído: status=${completedRun.status}`,
        );
        return 'Desculpe, algo deu errado. 😊 Pode tentar novamente?';
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
        console.log(`[GptService] Nenhuma mensagem do assistente encontrada`);
        // Fallback to greeting with manual client lookup
        const clientName = phone
          ? await this.getClientNameFallback(phone)
          : 'Cliente';
        return `Olá ${clientName}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`;
      }

      const responseContent = assistantMessages[0].content[0];
      if (!responseContent || responseContent.type !== 'text') {
        console.log(`[GptService] Resposta do assistente não contém texto`);
        // Fallback to greeting with manual client lookup
        const clientName = phone
          ? await this.getClientNameFallback(phone)
          : 'Cliente';
        return `Olá ${clientName}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`;
      }

      console.log(
        `[GptService] Resposta do assistente: ${responseContent.text.value}`,
      );
      return responseContent.text.value;
    } catch (error) {
      console.error('[GptService] Erro ao gerar resposta:', error);
      // Fallback to greeting with manual client lookup
      const clientName = session?.telefone
        ? await this.getClientNameFallback(session.telefone)
        : 'Cliente';
      return `Olá ${clientName}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`;
    }
  }

  private async handleRun(threadId: string, runId: string) {
    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    const pendingStatuses = ['queued', 'in_progress', 'requires_action'];
    let attempts = 0;
    const maxAttempts = 30;

    while (pendingStatuses.includes(run.status) && attempts < maxAttempts) {
      console.log(
        `[GptService] Status do run: ${run.status}, tentativa: ${attempts + 1}`,
      );
      if (run.status === 'requires_action' && run.required_action) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
        console.log(
          `[GptService] Tool calls recebidos:`,
          JSON.stringify(toolCalls),
        );

        if (toolCalls.length === 0) {
          console.warn(
            `[GptService] Nenhum tool call recebido, continuando...`,
          );
        }

        const toolOutputs: Array<{
          tool_call_id: string;
          output: string;
        }> = [];

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'checkClientByPhone') {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log(
                `[GptService] Assistente solicitou checkClientByPhone para telefone: ${args.phone}`,
              );
              const result = await this.trinksService.checkClientByPhone(
                args.phone,
              );
              console.log(
                `[GptService] Resultado de checkClientByPhone:`,
                JSON.stringify(result),
              );

              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(result),
              });
            } catch (error) {
              console.error(
                `[GptService] Erro ao executar checkClientByPhone:`,
                error,
              );
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ data: [] }),
              });
            }
          } else {
            console.warn(
              `[GptService] Função desconhecida solicitada: ${toolCall.function.name}`,
            );
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ error: 'Unknown function' }),
            });
          }
        }

        if (toolOutputs.length > 0) {
          console.log(
            `[GptService] Submetendo tool outputs:`,
            JSON.stringify(toolOutputs),
          );
          await this.openai.beta.threads.runs.submitToolOutputs(
            threadId,
            runId,
            {
              tool_outputs: toolOutputs,
            },
          );
        } else {
          console.warn(
            `[GptService] Nenhum tool output para submeter, continuando...`,
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.error(
        `[GptService] Máximo de tentativas atingido: status=${run.status}`,
      );
    }

    console.log(`[GptService] Run concluído com status: ${run.status}`);
    return run;
  }

  private async getClientNameFallback(phone: string): Promise<string> {
    try {
      const clientData = await this.trinksService.checkClientByPhone(phone);
      if (clientData?.data?.length > 0 && clientData.data[0]?.nome) {
        return clientData.data[0].nome.split(' ')[0];
      }
    } catch (error) {
      console.error('[GptService] Erro no fallback de nome:', error);
    }
    return 'Cliente';
  }
}
