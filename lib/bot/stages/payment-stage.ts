// Stage para manejar pago pendiente y confirmación final
import { BotResponse, BotSession } from '../types';
import { sessionManager } from '../services/session-manager';
import { emailService } from '../services/email-service';
import { airtableService } from '../services/airtable-service';

export async function handlePendingPaymentStage(
  text: string,
  sessionId: string,
  currentSession: BotSession
): Promise<BotResponse> {
  const lowerText = text.toLowerCase().trim();
  
  // Simular verificación de pago (en producción esto vendría de webhook de pago)
  if (lowerText.includes('pago') || lowerText.includes('pagé') || lowerText.includes('confirmé') || 
      lowerText.includes('realicé') || lowerText.includes('completé') || lowerText.includes('ya pagué')) {
    
    // Transicionar a pago completado
    const updatedSession = sessionManager.transitionToStage(sessionId, 'payment-completed', {
      paymentConfirmed: true,
      paymentDate: new Date().toISOString()
    });

    if (!updatedSession) {
      return {
        text: "Hubo un error confirmando tu pago. Por favor intenta nuevamente.",
        session: currentSession
      };
    }

    return await createFinalConfirmation(updatedSession);
  }

  // Respuestas para otros tipos de mensaje
  if (lowerText.includes('ayuda') || lowerText.includes('problema') || lowerText.includes('no puedo')) {
    return {
      text: "Te entiendo. Para completar tu reserva necesitas hacer clic en el enlace de pago que te envié.\n\n" +
            "Si tienes algún problema técnico, puedes:\n" +
            "• Intentar desde otro dispositivo\n" +
            "• Usar otro método de pago\n" +
            "• Contactarnos directamente\n\n" +
            "Una vez que completes el pago, escríbeme \"Ya pagué\" para confirmar tu cita.",
      session: currentSession
    };
  }

  // Mensaje por defecto - recordar el pago
  const { selectedRecord } = currentSession;
  const doctorName = selectedRecord?.fields?.['Name (from Médico)']?.[0] || 'el médico';
  const fecha = selectedRecord?.fields?.Fecha || 'la fecha programada';
  const hora = selectedRecord?.fields?.Hora || 'la hora programada';

  return {
    text: `Para confirmar tu cita con **Dr. ${doctorName}** el **${fecha}** a las **${hora}**, necesitas completar el pago de **$2.990 CLP**.\n\n` +
          `💳 Haz clic en el enlace de pago que te envié anteriormente.\n\n` +
          `Una vez que completes el pago, escríbeme **"Ya pagué"** para confirmar tu reserva.`,
    session: currentSession,
    paymentButton: currentSession.paymentUrl ? {
      text: "💳 Procesar Pago",
      url: currentSession.paymentUrl,
      amount: "$2.990 CLP"
    } : undefined
  };
}

export async function handlePaymentCompletedStage(
  text: string,
  sessionId: string,
  currentSession: BotSession
): Promise<BotResponse> {
  // El pago ya está confirmado, mostrar información final
  return await createFinalConfirmation(currentSession);
}

export async function createFinalConfirmation(session: BotSession): Promise<BotResponse> {
  const { 
    patientName, 
    selectedRecord, 
    patientPhone, 
    patientEmail,
    patientRut,
    patientAge 
  } = session;
  
  if (!selectedRecord) {
    return {
      text: "Hubo un error con la información de tu cita. Por favor, contacta nuestro soporte.",
      session: session
    };
  }

  const doctorName = selectedRecord.fields?.['Name (from Médico)']?.[0] || 'Médico';
  const fecha = selectedRecord.fields?.Fecha || '';
  const hora = selectedRecord.fields?.Hora || '';
  const clinica = selectedRecord.fields?.['Clínica'] || selectedRecord.fields?.['Clinica'] || 'Clínica';
  const direccion = selectedRecord.fields?.['Dirección'] || selectedRecord.fields?.['Direccion'] || '';
  const especialidad = selectedRecord.fields?.Especialidad || 'Especialidad';

  // Generar número de confirmación (simulado)
  const confirmationNumber = `SC${Date.now().toString().slice(-6)}`;

  // Enviar email de confirmación al paciente
  try {
    const emailSent = await emailService.sendPatientConfirmation(session, confirmationNumber);
    console.log(`📧 Patient confirmation email: ${emailSent ? '✅ Sent' : '❌ Failed'}`);
  } catch (error) {
    console.error('❌ Error sending patient confirmation email:', error);
  }

  // Enviar notificaciones al doctor (email + WhatsApp)
  try {
    const medicoCampo = selectedRecord.fields?.Médico;
    const doctorId = Array.isArray(medicoCampo) ? medicoCampo[0] : medicoCampo;
    if (doctorId && typeof doctorId === 'string') {
      const doctorNotificationSent = await emailService.sendDoctorNotification(session, doctorId);
      console.log(`🏥 Doctor notifications: ${doctorNotificationSent ? '✅ Sent' : '❌ Failed'}`);
    } else {
      console.warn('⚠️ No doctor ID found for notification');
    }
  } catch (error) {
    console.error('❌ Error sending doctor notifications:', error);
  }

  // Crear registro del paciente en la tabla Patients
  try {
    const patientData = {
      Nombre: patientName || 'Paciente',
      RUT: patientRut || '',
      Telefono: patientPhone || '',
      Email: patientEmail || '',
      Edad: patientAge || null,
      MotivoConsulta: session.motivo || '',
      Especialidad: selectedRecord.fields?.Especialidad || '',
      MedicoAsignado: selectedRecord.fields?.['Name (from Médico)']?.[0] || '',
      FechaCita: selectedRecord.fields?.Fecha || '',
      HoraCita: selectedRecord.fields?.Hora || '',
      Clinica: selectedRecord.fields?.['Clínica'] || selectedRecord.fields?.['Clinica'] || '',
      NumeroConfirmacion: confirmationNumber,
      EstadoCita: 'Confirmada',
      FechaRegistro: new Date().toISOString().split('T')[0],
      FechaCreacion: new Date().toISOString(),
      FuenteRegistro: 'SobrecuposIA-Bot'
    };

    const patientId = await airtableService.createPatient(patientData);
    if (patientId) {
      console.log(`✅ Patient record created in Airtable: ${patientId}`);
    } else {
      console.warn('⚠️ Failed to create patient record in Airtable');
    }
  } catch (error) {
    console.error('❌ Error creating patient record:', error);
  }

  // Marcar la sesión como completada
  sessionManager.transitionToStage(session.sessionId || '', 'completed', {
    confirmationNumber,
    completedAt: new Date().toISOString()
  });

  const mensajeFinal = 
    `🎉 **¡RESERVA CONFIRMADA!** 🎉\n\n` +
    `✅ **Tu cita ha sido exitosamente reservada**\n\n` +
    `📋 **DETALLES DE TU CITA:**\n` +
    `• **Paciente:** ${patientName}\n` +
    `• **RUT:** ${patientRut}\n` +
    `• **Edad:** ${patientAge} años\n` +
    `• **Especialidad:** ${especialidad}\n` +
    `• **Médico:** Dr. ${doctorName}\n` +
    `• **Fecha:** ${fecha}\n` +
    `• **Hora:** ${hora}\n` +
    `• **Clínica:** ${clinica}\n` +
    `• **Dirección:** ${direccion}\n` +
    `• **Email:** ${patientEmail}\n` +
    `• **Teléfono:** ${patientPhone}\n\n` +
    `💰 **Pago:** $2.990 CLP - ✅ **CONFIRMADO**\n` +
    `🔢 **N° Confirmación:** ${confirmationNumber}\n\n` +
    `📧 Te enviaremos un correo de confirmación a ${patientEmail} con todos los detalles.\n\n` +
    `📱 También recibirás un recordatorio por SMS al ${patientPhone} antes de tu cita.\n\n` +
    `ℹ️ **IMPORTANTE:**\n` +
    `• Llega 15 minutos antes de tu cita\n` +
    `• Trae tu carnet de identidad\n` +
    `• Si necesitas cancelar, hazlo con al menos 2 horas de anticipación\n\n` +
    `¡Gracias por usar Sobrecupos IA! 😊\n` +
    `¿Necesitas algo más?`;

  return {
    text: mensajeFinal,
    session: session
  };
}