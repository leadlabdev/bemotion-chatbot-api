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

      // Obter ou criar thread para o usuário
      const threadId = await this.getOrCreateThread(userId);

      const currentDate = new Date().toISOString().split('T')[0]; // Ex.: '2025-05-07'
      const phone = session?.telefone;
      const enhancedMessage = `[Contexto: Nome do cliente: Cliente, Telefone: ${phone || 'desconhecido'}, Data atual: ${currentDate}]\n${message}`;
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
        return this.getDefaultGreeting(phone);
      }

      // Obter a resposta mais recente
      return await this.getLatestResponse(threadId, phone);
    } catch (error) {
      console.error('[GptService] Erro ao gerar resposta:', error);
      return this.getDefaultGreeting(session?.telefone);
    }
  }

  private async getOrCreateThread(userId: string): Promise<string> {
    let threadId = this.threadCache.get(userId);
    if (!threadId) {
      const thread = await this.openai.beta.threads.create();
      threadId = thread.id;
      this.threadCache.set(userId, threadId);
      console.log(`[GptService] Nova thread criada: threadId=${threadId}`);
    }
    return threadId;
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
        await this.handleRequiredAction(threadId, runId, run.required_action);
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

  private async handleRequiredAction(
    threadId: string,
    runId: string,
    requiredAction: any,
  ) {
    const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
    console.log(
      `[GptService] Tool calls recebidos:`,
      JSON.stringify(toolCalls),
    );

    if (toolCalls.length === 0) {
      console.warn(`[GptService] Nenhum tool call recebido, continuando...`);
      return;
    }

    const toolOutputs: Array<{ tool_call_id: string; output: string }> = [];

    for (const toolCall of toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        const output = await this.executeToolCall(toolCall.function.name, args);
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify(output),
        });
      } catch (error) {
        console.error(
          `[GptService] Erro ao executar função ${toolCall.function.name}:`,
          error,
        );
        toolOutputs.push({
          tool_call_id: toolCall.id,
          output: JSON.stringify({ error: 'Erro ao executar função' }),
        });
      }
    }

    if (toolOutputs.length > 0) {
      console.log(
        `[GptService] Submetendo tool outputs:`,
        JSON.stringify(toolOutputs),
      );
      await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
        tool_outputs: toolOutputs,
      });
    }
  }

  private async executeToolCall(functionName: string, args: any): Promise<any> {
    console.log(`[GptService] Executando função: ${functionName}, args:`, args);

    switch (functionName) {
      case 'checkClientByPhone':
        return await this.trinksService.checkClientByPhone(args.phone);

      case 'createClient':
        return {
          id: await this.trinksService.createClient(
            args.name,
            args.phone,
            args.gender,
          ),
        };

      case 'listServices':
        return {
          services: await this.trinksService.listServices(args.searchTerm),
        };

      case 'listAvailableProfessionals':
        return {
          professionals: await this.trinksService.listAvailableProfessionals(),
        };

      case 'listProfessionalServices':
        return {
          services: await this.trinksService.listProfessionalServices(
            args.professionalId,
          ),
        };

      case 'getProfessionalAvailability':
        return await this.trinksService.getProfessionalAvailability(
          args.professionalId,
          args.date,
        );

      case 'createAppointment':
        return {
          appointmentId: await this.trinksService.createAppointment(
            args.clientId,
            args.professionalId,
            args.serviceId,
            args.durationInMinutes,
            args.price,
            args.startDateTime,
            args.notes,
          ),
        };

      default:
        console.warn(`[GptService] Função desconhecida: ${functionName}`);
        return { error: 'Unknown function' };
    }
  }

  private async getLatestResponse(
    threadId: string,
    phone?: string,
  ): Promise<string> {
    const messages = await this.openai.beta.threads.messages.list(threadId);
    const assistantMessages = messages.data
      .filter((msg) => msg.role === 'assistant')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    if (assistantMessages.length === 0) {
      console.log(`[GptService] Nenhuma mensagem do assistente encontrada`);
      return this.getDefaultGreeting(phone);
    }

    const responseContent = assistantMessages[0].content[0];
    if (!responseContent || responseContent.type !== 'text') {
      console.log(`[GptService] Resposta do assistente não contém texto`);
      return this.getDefaultGreeting(phone);
    }

    console.log(
      `[GptService] Resposta do assistente: ${responseContent.text.value}`,
    );
    return responseContent.text.value;
  }

  private async getDefaultGreeting(phone?: string): Promise<string> {
    const clientName = phone
      ? await this.getClientNameFallback(phone)
      : 'Cliente';

    return `Olá ${clientName}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`;
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
