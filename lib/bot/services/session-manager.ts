// Manejador de sesiones del bot
import { BotSession, BotStage, SESSION_TIMEOUT } from '../types';

export class SessionManager {
  private sessions: Map<string, BotSession> = new Map();

  // Obtener sesión actual
  getSession(sessionId: string): BotSession | null {
    const session = this.sessions.get(sessionId);
    console.log(`🔍 SessionManager.getSession(${sessionId}):`, session ? `ENCONTRADA stage=${session.stage}` : 'NO ENCONTRADA');
    console.log(`🔍 Total sesiones en memoria: ${this.sessions.size}`);
    
    if (session) {
      // Actualizar última actividad
      session.lastActivity = Date.now();
    }
    
    return session || null;
  }

  // Crear nueva sesión
  createSession(
    sessionId: string, 
    stage: BotStage, 
    data: Partial<BotSession> = {}
  ): BotSession {
    const session: BotSession = {
      stage,
      attempts: 0,
      lastActivity: Date.now(),
      ...data
    };

    this.sessions.set(sessionId, session);
    console.log(`🔧 SessionManager.createSession(${sessionId}, ${stage}):`, {
      stage: session.stage,
      totalSessions: this.sessions.size
    });
    
    return session;
  }

  // Actualizar sesión existente
  updateSession(
    sessionId: string, 
    updates: Partial<BotSession>
  ): BotSession | null {
    const currentSession = this.sessions.get(sessionId);
    
    if (!currentSession) {
      return null;
    }

    const updatedSession = {
      ...currentSession,
      ...updates,
      lastActivity: Date.now()
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  // Eliminar sesión
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  // Limpiar sesiones expiradas
  cleanExpiredSessions(): void {
    const now = Date.now();
    
    // Convertir a array para evitar problemas de iteración
    const entries = Array.from(this.sessions.entries());
    for (const [sessionId, session] of entries) {
      if (session.lastActivity && (now - session.lastActivity) > SESSION_TIMEOUT) {
        console.log(`🧹 Limpiando sesión expirada: ${sessionId}`);
        this.sessions.delete(sessionId);
      }
    }
  }

  // Obtener estadísticas de sesiones
  getStats(): {
    total: number;
    byStage: Record<string, number>;
    expired: number;
  } {
    const now = Date.now();
    let expired = 0;
    const byStage: Record<string, number> = {};
    
    // Convertir a array para evitar problemas de iteración
    const sessions = Array.from(this.sessions.values());
    for (const session of sessions) {
      if (session.lastActivity && (now - session.lastActivity) > SESSION_TIMEOUT) {
        expired++;
      } else {
        byStage[session.stage] = (byStage[session.stage] || 0) + 1;
      }
    }

    return {
      total: this.sessions.size,
      byStage,
      expired
    };
  }

  // Validar integridad de sesión
  validateSession(session: BotSession): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];
    
    // Validaciones básicas
    if (!session.stage) missingFields.push('stage');
    if (session.attempts === undefined) missingFields.push('attempts');
    
    // Validaciones específicas por stage
    switch (session.stage) {
      case 'getting-name':
        if (!session.specialty) missingFields.push('specialty');
        if (!session.records) missingFields.push('records');
        break;
        
      case 'getting-rut':
        if (!session.patientName) missingFields.push('patientName');
        break;
        
      case 'getting-age':
        if (!session.patientRut) missingFields.push('patientRut');
        break;
        
      case 'choosing-from-options':
        if (!session.selectedOptions) missingFields.push('selectedOptions');
        break;
        
      case 'getting-phone':
        if (!session.patientAge) missingFields.push('patientAge');
        break;
        
      case 'getting-email':
        if (!session.patientPhone) missingFields.push('patientPhone');
        break;
        
      case 'pending-payment':
        if (!session.selectedRecord) missingFields.push('selectedRecord');
        break;
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  // Reparar sesión con datos faltantes
  repairSession(
    sessionId: string, 
    repairs: Partial<BotSession>
  ): BotSession | null {
    const session = this.getSession(sessionId);
    
    if (!session) return null;
    
    const validation = this.validateSession(session);
    
    if (validation.isValid) {
      return session; // No necesita reparación
    }
    
    console.log(`🔧 Reparando sesión ${sessionId}, campos faltantes:`, validation.missingFields);
    
    return this.updateSession(sessionId, repairs);
  }

  // Transición segura entre stages
  transitionToStage(
    sessionId: string,
    newStage: BotStage,
    additionalData: Partial<BotSession> = {}
  ): BotSession | null {
    const session = this.getSession(sessionId);
    
    if (!session) {
      console.error(`❌ No se puede hacer transición: sesión ${sessionId} no existe`);
      return null;
    }

    // Validar que la transición es válida
    if (!this.isValidTransition(session.stage, newStage)) {
      console.warn(`⚠️ Transición inválida de ${session.stage} a ${newStage} para sesión ${sessionId}`);
    }

    return this.updateSession(sessionId, {
      stage: newStage,
      attempts: 0, // Reset attempts en nueva etapa
      ...additionalData
    });
  }

  // Validar si una transición entre stages es válida
  private isValidTransition(currentStage: BotStage, newStage: BotStage): boolean {
    const validTransitions: Partial<Record<BotStage, BotStage[]>> = {
      'getting-name': ['getting-rut'],
      'getting-rut': ['getting-age'],
      'getting-age': ['choosing-from-options'],
      'choosing-from-options': ['getting-phone', 'confirming-appointment'],
      'confirming-appointment': ['getting-phone'],
      'getting-phone': ['getting-email'],
      'getting-email': ['pending-payment'],
      'pending-payment': ['payment-completed'],
      'payment-completed': [],
      // Otros stages especiales
      'asking-for-contact-data': ['getting-name'],
      'choosing-alternative': ['getting-phone'],
      'awaiting-confirmation': ['getting-phone']
    };

    const allowedTransitions = validTransitions[currentStage] || [];
    return allowedTransitions.includes(newStage);
  }

  // Reiniciar sesión a estado inicial manteniendo contexto importante
  resetSession(
    sessionId: string, 
    keepData: string[] = ['specialty', 'motivo', 'respuestaEmpatica']
  ): BotSession {
    const currentSession = this.getSession(sessionId);
    const dataToKeep: Partial<BotSession> = {};
    
    if (currentSession) {
      keepData.forEach(key => {
        if (key in currentSession) {
          (dataToKeep as any)[key] = (currentSession as any)[key];
        }
      });
    }

    return this.createSession(sessionId, 'getting-name', dataToKeep);
  }
}

// Instancia singleton del manejador de sesiones
export const sessionManager = new SessionManager();

// Cleanup automático cada 10 minutos (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    sessionManager.cleanExpiredSessions();
  }, 10 * 60 * 1000);
}