// Stage para recolectar teléfono del paciente
import { BotResponse, BotSession } from '../types';
import { validarTelefono, analizarConfusion } from '../utils';
import { sessionManager } from '../services/session-manager';

export function handlePhoneStage(
  text: string,
  sessionId: string,
  currentSession: BotSession
): BotResponse {
  if (!validarTelefono(text)) {
    const mensajeError = analizarConfusion(text, 'telefono');
    currentSession.attempts = (currentSession.attempts || 0) + 1;
    
    // Si ya intentó 3 veces, ofrecer ayuda adicional
    const ayudaAdicional = currentSession.attempts >= 3 ? 
      "\n\n💡 *Formatos válidos de teléfono:*\n• +56912345678 (celular con +56)\n• 912345678 (celular sin código)\n• 221234567 (fijo con código de área)\n• 12345678 (fijo sin código)" : "";
    
    const updatedSession = sessionManager.updateSession(sessionId, currentSession);
    
    return {
      text: `${mensajeError}${ayudaAdicional}`,
      session: updatedSession || currentSession
    };
  }

  // Teléfono válido, transicionar a pedir email
  const updatedSession = sessionManager.transitionToStage(sessionId, 'getting-email', {
    patientPhone: text.trim()
  });

  if (!updatedSession) {
    return {
      text: "Hubo un error procesando tu teléfono. Por favor intenta nuevamente.",
      session: currentSession
    };
  }

  return {
    text: "Perfecto! 📧\n\nAhora necesito tu correo electrónico para enviarte la confirmación.\nEjemplo: maria@gmail.com",
    session: updatedSession
  };
}