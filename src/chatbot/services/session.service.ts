import { RedisService } from '@/redis/redis.service';
import { Injectable, Logger } from '@nestjs/common';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SessionData {
  telefone: string;
  messages: Message[];
  lastRunId: string | null;
  threadId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_TTL_SECONDS = 3600 * 24; // 24 horas
  private readonly sessions = new Map<string, SessionData>(); // Fallback em memória

  constructor(private readonly redisService: RedisService) {}

  private createDefaultSession(telefone: string): SessionData {
    const now = new Date();
    return {
      telefone,
      messages: [],
      lastRunId: null,
      threadId: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private getSessionKey(telefone: string): string {
    return `session:${telefone}`;
  }

  private validateSessionData(session: any): session is SessionData {
    return (
      session &&
      typeof session === 'object' &&
      typeof session.telefone === 'string' &&
      Array.isArray(session.messages) &&
      session.messages.every(
        (msg: any) =>
          msg &&
          typeof msg === 'object' &&
          ['user', 'assistant'].includes(msg.role) &&
          typeof msg.content === 'string',
      )
    );
  }

  async getSession(telefone: string): Promise<SessionData> {
    try {
      const cacheKey = this.getSessionKey(telefone);
      let session = await this.redisService.get<SessionData>(cacheKey);

      // Se não encontrou no Redis, tenta buscar no fallback
      if (!session) {
        session = this.sessions.get(telefone) || null;
      }

      // Se ainda não encontrou ou dados inválidos, cria nova sessão
      if (!session || !this.validateSessionData(session)) {
        if (session) {
          this.logger.warn(
            `Dados de sessão inválidos para ${telefone}, criando nova sessão`,
          );
        } else {
          this.logger.log(
            `Sessão não encontrada para ${telefone}, criando nova sessão padrão`,
          );
        }

        session = this.createDefaultSession(telefone);
        await this.saveSession(telefone, session);
      }

      // Garante que as datas sejam objetos Date
      if (session.createdAt && !(session.createdAt instanceof Date)) {
        session.createdAt = new Date(session.createdAt);
      }
      if (session.updatedAt && !(session.updatedAt instanceof Date)) {
        session.updatedAt = new Date(session.updatedAt);
      }

      this.logger.log('SessionService - getSession:', {
        telefone: session.telefone,
        messagesCount: session.messages.length,
        lastRunId: session.lastRunId,
        threadId: session.threadId,
      });

      return session;
    } catch (error) {
      this.logger.error(`Erro ao buscar sessão para ${telefone}:`, error);
      const defaultSession = this.createDefaultSession(telefone);
      await this.saveSession(telefone, defaultSession);
      return defaultSession;
    }
  }

  private async saveSession(
    telefone: string,
    session: SessionData,
  ): Promise<void> {
    const cacheKey = this.getSessionKey(telefone);

    const savedToRedis = await this.redisService.set(
      cacheKey,
      session,
      this.SESSION_TTL_SECONDS,
    );

    if (!savedToRedis) {
      this.logger.warn(
        `Falha ao salvar no Redis, usando fallback para ${telefone}`,
      );
    }

    this.sessions.set(telefone, session);
  }

  async updateSession(
    telefone: string,
    updates: Partial<SessionData>,
  ): Promise<void> {
    try {
      const currentSession = await this.getSession(telefone);

      const updatedSession: SessionData = {
        ...currentSession,
        ...updates,
        telefone,
        updatedAt: new Date(),

        messages: updates.messages
          ? [...currentSession.messages, ...updates.messages]
          : currentSession.messages,
      };

      await this.saveSession(telefone, updatedSession);

      this.logger.log('SessionService - updateSession:', {
        telefone: updatedSession.telefone,
        messagesCount: updatedSession.messages.length,
        lastRunId: updatedSession.lastRunId,
        threadId: updatedSession.threadId,
      });
    } catch (error) {
      this.logger.error(`Erro ao atualizar sessão para ${telefone}:`, error);
      throw error;
    }
  }

  async addMessage(
    telefone: string,
    role: 'user' | 'assistant',
    content: string,
  ): Promise<void> {
    try {
      const session = await this.getSession(telefone);

      const newMessage: Message = {
        role,
        content,
        timestamp: new Date(),
      };

      session.messages.push(newMessage);
      session.updatedAt = new Date();

      await this.saveSession(telefone, session);

      this.logger.debug(
        `Mensagem adicionada para ${telefone}: ${role} - ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
      );
    } catch (error) {
      this.logger.error(`Erro ao adicionar mensagem para ${telefone}:`, error);
      throw error;
    }
  }

  async clearSession(telefone: string): Promise<void> {
    try {
      const cacheKey = this.getSessionKey(telefone);
      await this.redisService.delete(cacheKey);
      this.sessions.delete(telefone);
      this.logger.log(`Sessão removida para ${telefone}`);
    } catch (error) {
      this.logger.error(`Erro ao remover sessão para ${telefone}:`, error);
    }
  }

  async getSessionStats(telefone: string): Promise<{
    messageCount: number;
    hasThread: boolean;
    lastActivity: Date | null;
    sessionAge: number;
  }> {
    try {
      const session = await this.getSession(telefone);
      const now = new Date();
      const sessionAge = session.updatedAt
        ? Math.floor(
            (now.getTime() - session.updatedAt.getTime()) / (1000 * 60),
          )
        : 0;

      return {
        messageCount: session.messages.length,
        hasThread: !!session.threadId,
        lastActivity: session.updatedAt,
        sessionAge,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao obter estatísticas da sessão para ${telefone}:`,
        error,
      );
      return {
        messageCount: 0,
        hasThread: false,
        lastActivity: null,
        sessionAge: 0,
      };
    }
  }
}
