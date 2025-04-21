import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  private sessions = new Map<string, any>();

  getSession(telefone: string): any {
    const session = this.sessions.get(telefone) || {};
    console.log('SessionService - getSession:', { telefone, session });
    return session;
  }

  updateSession(telefone: string, session: any): void {
    console.log('SessionService - updateSession:', { telefone, session });
    this.sessions.set(telefone, session);
  }
}
