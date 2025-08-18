// app/api/bot/core/session-manager.ts
import { SessionData, SessionStage } from '../../../../types/medical';

export class SessionManager {
  private static sessions: Map<string, SessionData> = new Map();
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  private static cleanupInterval: NodeJS.Timeout | null = null;

  static initCleanup(): void {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
          if (now - session.conversationState.lastActivity > this.SESSION_TIMEOUT) {
            console.log(`🧹 Limpiando sesión expirada: ${sessionId}`);
            this.sessions.delete(sessionId);
          }
        }
      }, 10 * 60 * 1000); // Cada 10 minutos
    }
  }

  static getOrCreateSession(sessionId?: string): SessionData {
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = this.createNewSession(sessionId);
      this.sessions.set(sessionId, session);
    } else {
      // Actualizar actividad
      session.conversationState.lastActivity = Date.now();
    }

    return session;
  }

  static updateSession(sessionId: string, updates: Partial<SessionData>): SessionData {
    const session = this.getOrCreateSession(sessionId);
    
    // Merge inteligente preservando estructura
    const updatedSession: SessionData = {
      ...session,
      ...updates,
      conversationState: {
        ...session.conversationState,
        ...updates.conversationState,
        lastActivity: Date.now()
      }
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  static setStage(sessionId: string, stage: SessionStage): SessionData {
    return this.updateSession(sessionId, { stage });
  }

  static addMessage(sessionId: string, message: string): SessionData {
    const session = this.getOrCreateSession(sessionId);
    const messageHistory = [...session.conversationState.messageHistory, message];
    
    // Mantener solo últimos 10 mensajes para performance
    if (messageHistory.length > 10) {
      messageHistory.splice(0, messageHistory.length - 10);
    }

    return this.updateSession(sessionId, {
      conversationState: {
        ...session.conversationState,
        messageHistory
      }
    });
  }

  static incrementAttempts(sessionId: string): SessionData {
    const session = this.getOrCreateSession(sessionId);
    return this.updateSession(sessionId, {
      conversationState: {
        ...session.conversationState,
        attempts: session.conversationState.attempts + 1
      }
    });
  }

  static resetAttempts(sessionId: string): SessionData {
    const session = this.getOrCreateSession(sessionId);
    return this.updateSession(sessionId, {
      conversationState: {
        ...session.conversationState,
        attempts: 0
      }
    });
  }

  static getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  static deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  static getSessionCount(): number {
    return this.sessions.size;
  }

  private static createNewSession(sessionId: string): SessionData {
    return {
      id: sessionId,
      stage: 'welcome',
      conversationState: {
        attempts: 0,
        lastActivity: Date.now(),
        messageHistory: []
      }
    };
  }

  // Método para debugging/monitoring
  static getSessionStats(): {
    totalSessions: number;
    activeStages: Record<SessionStage, number>;
    averageMessages: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const totalSessions = sessions.length;
    
    const activeStages = sessions.reduce((acc, session) => {
      acc[session.stage] = (acc[session.stage] || 0) + 1;
      return acc;
    }, {} as Record<SessionStage, number>);

    const totalMessages = sessions.reduce((sum, session) => 
      sum + session.conversationState.messageHistory.length, 0);
    
    const averageMessages = totalSessions > 0 ? totalMessages / totalSessions : 0;

    return {
      totalSessions,
      activeStages,
      averageMessages
    };
  }
}