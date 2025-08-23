// Stage para recolectar nombre del paciente
import { BotResponse, BotSession } from '../types';
import { sessionManager } from '../services/session-manager';

export function handleNameStage(
  text: string,
  sessionId: string,
  currentSession: BotSession
): BotResponse {
  // Validar que el nombre no esté vacío y tenga formato razonable
  const nombre = text.trim();
  
  if (!nombre || nombre.length < 2) {
    return {
      text: "Por favor ingresa tu nombre completo (nombre y apellido).",
      session: currentSession
    };
  }

  // Validación básica de formato de nombre
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(nombre)) {
    currentSession.attempts = (currentSession.attempts || 0) + 1;
    
    const mensajeError = currentSession.attempts >= 3 
      ? "\n\n💡 *Ejemplo de nombre válido:* Juan Pérez o María González"
      : "";
    
    return {
      text: `Por favor ingresa un nombre válido (solo letras y espacios).${mensajeError}`,
      session: currentSession
    };
  }

  // Nombre válido, transicionar a pedir RUT
  const updatedSession = sessionManager.transitionToStage(sessionId, 'getting-rut', {
    patientName: nombre
  });

  if (!updatedSession) {
    return {
      text: "Hubo un error procesando tu información. Por favor intenta nuevamente.",
      session: currentSession
    };
  }

  return {
    text: `Perfecto, ${nombre}! 📋\n\nAhora necesito tu RUT para completar los datos.\nEjemplo: 12345678-9`,
    session: updatedSession
  };
}