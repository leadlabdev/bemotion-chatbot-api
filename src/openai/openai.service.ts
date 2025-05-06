import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GptService {
  private openai: OpenAI;
  private assistantId: string = 'asst_wfI9H5irkU3QLxF2zfRz2gAh';
  private threadCache: Map<string, string> = new Map();
  private trinksApiKey: string = 'kdy1HCm2Is6Oj4EYeNupN2la9k2dYqot7vorGi89';
  private trinksBaseUrl: string = 'https://api.trinks.com/v1';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
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

      // Consultar o cliente pelo telefone da sessão
      let clientName = 'Cliente';
      const phone = session?.telefone;
      console.log(`[GptService] Telefone extraído da sessão: ${phone}`);
      if (phone) {
        console.log(
          `[GptService] Chamando checkClientByPhone para telefone: ${phone}`,
        );
        const clientData = await this.checkClientByPhone(phone, 54027);
        console.log(`[GptService] Resposta de checkClientByPhone:`, clientData);
        if (clientData?.data?.length > 0 && clientData.data[0]?.nome) {
          clientName = clientData.data[0].nome.split(' ')[0]; // Usar apenas o primeiro nome
          console.log(`[GptService] Nome do cliente extraído: ${clientName}`);
        } else {
          console.log(
            `[GptService] Nenhum cliente encontrado para telefone: ${phone}`,
          );
        }
      } else {
        console.log(`[GptService] Nenhum telefone fornecido na sessão`);
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
      const enhancedMessage = `[Contexto: Nome do cliente: ${clientName}, Telefone: ${phone || 'desconhecido'}]\n${message}`;
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
        return `Olá ${clientName}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`;
      }

      const responseContent = assistantMessages[0].content[0];
      if (!responseContent || responseContent.type !== 'text') {
        console.log(`[GptService] Resposta do assistente não contém texto`);
        return `Olá ${clientName}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`;
      }

      console.log(
        `[GptService] Resposta do assistente: ${responseContent.text.value}`,
      );
      return responseContent.text.value;
    } catch (error) {
      console.error('[GptService] Erro ao gerar resposta:', error);
      // Fallback to greeting if an error occurs
      const clientName = session?.telefone
        ? await this.getClientNameFallback(session.telefone)
        : 'Cliente';
      return `Olá ${clientName}, tudo bem? Me chamo Mari, muito prazer! Seja bem-vinda ao Mega Studio Normandia! 😊 Qual procedimento você está precisando no momento?`;
    }
  }

  // Helper method to fetch client name in case of error
  private async getClientNameFallback(phone: string): Promise<string> {
    try {
      const clientData = await this.checkClientByPhone(phone, 54027);
      if (clientData?.data?.length > 0 && clientData.data[0]?.nome) {
        return clientData.data[0].nome.split(' ')[0];
      }
    } catch (error) {
      console.error('[GptService] Erro no fallback de nome:', error);
    }
    return 'Cliente';
  }

  private async handleRun(threadId: string, runId: string) {
    let run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    const pendingStatuses = ['queued', 'in_progress', 'requires_action'];
    let attempts = 0;
    const maxAttempts = 30;

    while (pendingStatuses.includes(run.status) && attempts < maxAttempts) {
      if (run.status === 'requires_action' && run.required_action) {
        const toolCalls = run.required_action.submit_tool_outputs.tool_calls;

        for (const toolCall of toolCalls) {
          if (toolCall.function.name === 'checkClientByPhone') {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await this.checkClientByPhone(
              args.phone,
              args.estabelecimentoId,
            );

            // Submeter a saída da função
            await this.openai.beta.threads.runs.submitToolOutputs(
              threadId,
              runId,
              {
                tool_outputs: [
                  {
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(result),
                  },
                ],
              },
            );
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      attempts++;
    }

    return run;
  }

  private async checkClientByPhone(phone: string, estabelecimentoId: number) {
    try {
      console.log(
        `[GptService] Consultando cliente: telefone=${phone}, estabelecimentoId=${estabelecimentoId}`,
      );
      const response = await firstValueFrom(
        this.httpService.get(`${this.trinksBaseUrl}/clientes`, {
          headers: {
            'X-Api-Key': this.trinksApiKey,
            accept: 'application/json',
            estabelecimentoId: estabelecimentoId.toString(),
          },
          params: {
            telefone: phone,
            incluirDetalhes: false,
          },
        }),
      );
      console.log(
        `[GptService] Resposta da API Trinks:`,
        JSON.stringify(response.data),
      );
      return response.data;
    } catch (error) {
      console.error(
        `[GptService] Erro ao consultar cliente: ${error.message}`,
        error.response?.data,
      );
      return { data: [] };
    }
  }
}
