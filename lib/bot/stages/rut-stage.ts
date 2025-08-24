// Stage para recolectar RUT del paciente
import { BotResponse, BotSession } from '../types';
import { validarRUT, analizarConfusion, getFirstName } from '../utils';
import { sessionManager } from '../services/session-manager';

export function handleRutStage(
  text: string,
  sessionId: string,
  currentSession: BotSession
): BotResponse {
  if (!validarRUT(text)) {
    const mensajeError = analizarConfusion(text, 'rut');
    currentSession.attempts = (currentSession.attempts || 0) + 1;
    
    // Si ya intentó 3 veces, ofrecer ayuda adicional
    const ayudaAdicional = currentSession.attempts >= 3 ? 
      "\n\n💡 *Formatos válidos de RUT:*\n• 12345678-9\n• 12.345.678-9\n• 12345678-K" : "";
    
    const updatedSession = sessionManager.updateSession(sessionId, currentSession);
    
    return {
      text: `${mensajeError}${ayudaAdicional}`,
      session: updatedSession || currentSession
    };
  }

  // RUT válido, transicionar a pedir edad
  const updatedSession = sessionManager.transitionToStage(sessionId, 'getting-age', {
    patientRut: text.trim()
  });

  if (!updatedSession) {
    return {
      text: "Hubo un error procesando tu RUT. Por favor intenta nuevamente.",
      session: currentSession
    };
  }

  // Obtener primer nombre para respuesta humanizada
  const primerNombre = currentSession.firstName || getFirstName(currentSession.patientName || '');
  
  return {
    text: `Perfecto! 🎂\n\nY ¿cuál es tu edad?\nEj: 25`,
    session: updatedSession
  };
}