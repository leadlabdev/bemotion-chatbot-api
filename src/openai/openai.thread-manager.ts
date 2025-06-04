import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ThreadState } from './openai.service';

@Injectable()
export class ThreadManager {
  private readonly logger = new Logger(ThreadManager.name);
  private readonly threadCache: Map<
    string,
    { threadId: string; state: ThreadState }
  > = new Map();

  constructor(private readonly openai: OpenAI) {}

  async getOrCreateThread(userId: string): Promise<{
    threadId: string;
    state: ThreadState;
  }> {
    let threadData = this.threadCache.get(userId);
    if (!threadData) {
      try {
        const thread = await this.openai.beta.threads.create();
        threadData = {
          threadId: thread.id,
          state: { stage: 'inicial' },
        };
        this.threadCache.set(userId, threadData);
        this.logger.log(
          `Nova thread criada: threadId=${threadData.threadId}, userId=${userId}`,
        );
      } catch (error) {
        this.logger.error(`Erro ao criar thread para userId=${userId}`, error);
        throw new Error('Falha ao criar thread');
      }
    } else {
      this.logger.debug(
        `Thread existente recuperada: threadId=${threadData.threadId}, userId=${userId}`,
      );
    }
    return threadData;
  }

  getThreadState(userId: string): ThreadState | undefined {
    return this.threadCache.get(userId)?.state;
  }

  updateThreadState(userId: string, state: ThreadState): void {
    const threadData = this.threadCache.get(userId);
    if (threadData) {
      threadData.state = { ...threadData.state, ...state };
      this.threadCache.set(userId, threadData);
      this.logger.debug(
        `Estado da thread atualizado: userId=${userId}, state=${JSON.stringify(state)}`,
      );
    }
  }
}
