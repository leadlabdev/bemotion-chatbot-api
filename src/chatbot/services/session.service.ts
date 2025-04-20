import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  private sessions = new Map<string, any>();

  getSession(telefone: string): any {
    return this.sessions.get(telefone) || {};
  }

  updateSession(telefone: string, session: any): void {
    this.sessions.set(telefone, session);
  }
}
