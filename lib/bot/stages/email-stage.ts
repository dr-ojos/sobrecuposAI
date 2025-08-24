// Stage para recolectar email del paciente
import { BotResponse, BotSession } from '../types';
import { validarEmail, analizarConfusion, getFirstName } from '../utils';
import { sessionManager } from '../services/session-manager';

export function handleEmailStage(
  text: string,
  sessionId: string,
  currentSession: BotSession
): BotResponse {
  if (!validarEmail(text)) {
    const mensajeError = analizarConfusion(text, 'email');
    currentSession.attempts = (currentSession.attempts || 0) + 1;
    
    // Si ya intentó 3 veces, ofrecer ayuda adicional
    const ayudaAdicional = currentSession.attempts >= 3 ? 
      "\n\n💡 *Ejemplos de email válidos:*\n• maria@gmail.com\n• juan.perez@hotmail.com\n• contacto@empresa.cl" : "";
    
    const updatedSession = sessionManager.updateSession(sessionId, currentSession);
    
    return {
      text: `${mensajeError}${ayudaAdicional}`,
      session: updatedSession || currentSession
    };
  }

  // Email válido, transicionar a crear enlace de pago
  const updatedSession = sessionManager.transitionToStage(sessionId, 'pending-payment', {
    patientEmail: text.trim()
  });

  if (!updatedSession) {
    return {
      text: "Hubo un error procesando tu email. Por favor intenta nuevamente.",
      session: currentSession
    };
  }

  // Mostrar resumen y crear enlace de pago
  return createPaymentSummary(updatedSession, sessionId);
}

function createPaymentSummary(session: BotSession, sessionId: string): BotResponse {
  const { patientName, selectedRecord, patientPhone, patientEmail } = session;
  
  if (!selectedRecord) {
    return {
      text: "Hubo un error con la información de tu cita. Por favor, reinicia la consulta.",
      session: session
    };
  }

  const doctorName = selectedRecord.fields?.['Name (from Médico)']?.[0] || 'Médico';
  const fecha = selectedRecord.fields?.Fecha || '';
  const hora = selectedRecord.fields?.Hora || '';
  const clinica = selectedRecord.fields?.['Clínica'] || selectedRecord.fields?.['Clinica'] || 'Clínica';
  const direccion = selectedRecord.fields?.['Dirección'] || selectedRecord.fields?.['Direccion'] || '';

  // Crear URL de pago con parámetros para el bot simulado
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const paymentParams = new URLSearchParams({
    // Datos del paciente
    patientName: patientName || '',
    patientRut: session.patientRut || '',
    patientPhone: patientPhone || '',
    patientEmail: patientEmail || '',
    patientAge: session.patientAge ? session.patientAge.toString() : '',
    // Datos de la cita
    doctorName: doctorName,
    doctorId: Array.isArray(selectedRecord.fields?.Médico) ? selectedRecord.fields.Médico[0] : (selectedRecord.fields?.Médico || ''),
    specialty: session.specialty || '',
    date: fecha,
    time: hora,
    clinic: clinica,
    clinicAddress: direccion,
    // IDs críticos para Airtable
    sobrecupoId: selectedRecord.id || '',
    // Datos de pago
    amount: '2990',
    sessionId: sessionId,
    motivo: session.motivo || '',
    // Marcadores para pago simulado del bot
    fromChat: 'true'
  });
  
  const paymentUrl = `${baseUrl}/pago?${paymentParams.toString()}`;
  
  // Actualizar sesión con URL de pago
  session.paymentUrl = paymentUrl;

  const primerNombre = session.firstName || getFirstName(patientName || '');
  const resumen = `🎉 ¡Perfecto, ${primerNombre}! He preparado tu reserva:\n\n` +
    `👤 **Paciente:** ${patientName}\n` +
    `👨‍⚕️ **Médico:** Dr. ${doctorName}\n` +
    `📅 **Fecha:** ${fecha}\n` +
    `⏰ **Hora:** ${hora}\n` +
    `🏥 **Clínica:** ${clinica}\n` +
    `📍 **Dirección:** ${direccion}\n` +
    `📧 **Email:** ${patientEmail}\n` +
    `📞 **Teléfono:** ${patientPhone}\n\n` +
    `💰 **Valor:** $2.990 CLP\n\n` +
    `🔗 Para confirmar tu reserva, completa el pago haciendo clic en el siguiente enlace:`;

  return {
    text: resumen,
    session: session,
    paymentButton: {
      text: "💳 Procesar Pago",
      url: paymentUrl,
      amount: "$2.990 CLP"
    }
  };
}