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
      const thread = await this.openai.beta.threads.create();
      threadData = {
        threadId: thread.id,
        state: { stage: 'inicial' },
      };
      this.threadCache.set(userId, threadData);
      this.logger.log(`Nova thread criada: threadId=${threadData.threadId}`);
    }
    return threadData;
  }

  getThreadState(userId: string): ThreadState | undefined {
    return this.threadCache.get(userId)?.state;
  }
}
