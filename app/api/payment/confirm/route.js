// API para confirmar pago del bot (REAL, no simulado)
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { transactionId, sessionId, paymentData, isSimulated } = await req.json();
    
    console.log('💳 === CONFIRMANDO PAGO DEL BOT ===');
    console.log('📋 Transaction ID:', transactionId);
    console.log('📋 Session ID:', sessionId);
    console.log('📋 Is Simulated:', isSimulated);
    console.log('📋 Payment Data:', paymentData);

    if (!transactionId || !sessionId || !paymentData) {
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos para confirmación'
      }, { status: 400 });
    }

    // Importar dinámicamente los servicios TypeScript
    const { sessionManager } = await import('../../../lib/bot/services/session-manager.ts');
    
    // Obtener la sesión para acceder al selectedRecord
    const session = sessionManager.getSession(sessionId);
    if (!session || !session.selectedRecord) {
      return NextResponse.json({
        success: false,
        error: 'Sesión no encontrada o sin cita seleccionada'
      }, { status: 400 });
    }

    const sobrecupoId = session.selectedRecord.id;
    console.log('📋 Sobrecupo ID:', sobrecupoId);

    let results = {
      sobrecupoUpdated: false,
      patientCreated: false,
      emailsSent: 0,
      whatsappSent: false
    };

    // Importar servicio de Airtable dinámicamente
    const { airtableService } = await import('../../../lib/bot/services/airtable-service.ts');
    
    // 1. CONFIRMAR RESERVA EN AIRTABLE (REAL)
    console.log('📅 Actualizando sobrecupo en Airtable...');
    const sobrecupoData = {
      Disponible: 'No',
      // Limpiar campos de timeout
      'Session ID': null,
      'Payment Timeout': null,
      'Reserva Timestamp': null,
      // Datos del paciente
      Nombre: paymentData.patientName,
      Email: paymentData.patientEmail,
      Telefono: paymentData.patientPhone,
      RUT: paymentData.patientRut,
      ...(paymentData.patientAge ? { Edad: parseInt(paymentData.patientAge) } : {}),
      // Información de pago
      'Transaction ID': transactionId,
      'Payment Confirmed': new Date().toISOString()
    };

    results.sobrecupoUpdated = await airtableService.updateSobrecupo(sobrecupoId, sobrecupoData);
    
    if (!results.sobrecupoUpdated) {
      console.error('❌ No se pudo actualizar el sobrecupo');
      return NextResponse.json({
        success: false,
        error: 'Error actualizando la reserva'
      }, { status: 500 });
    }

    console.log('✅ Sobrecupo actualizado exitosamente');

    // 2. CREAR PACIENTE EN AIRTABLE (REAL)
    console.log('👤 Creando paciente en Airtable...');
    const patientData = {
      Nombre: paymentData.patientName,
      RUT: paymentData.patientRut,
      Telefono: paymentData.patientPhone,
      Email: paymentData.patientEmail,
      ...(paymentData.patientAge ? { Edad: parseInt(paymentData.patientAge) } : {}),
      'Fecha Registro': new Date().toISOString().split('T')[0],
      'Estado Pago': 'Pagado',
      'ID Transaccion': transactionId
    };

    const patientId = await airtableService.createPatient(patientData);
    results.patientCreated = !!patientId;
    
    if (results.patientCreated) {
      console.log('✅ Paciente creado exitosamente:', patientId);
    } else {
      console.log('⚠️ No se pudo crear el paciente, pero la reserva está confirmada');
    }

    // 3. ENVÍO DE EMAILS Y NOTIFICACIONES (REAL)
    console.log('📧 Enviando emails y notificaciones...');
    
    // Importar servicios de email y WhatsApp
    const { emailService } = await import('../../../lib/bot/services/email-service.ts');
    
    // Enviar email de confirmación al paciente
    const emailSent = await emailService.sendPatientConfirmation(session, transactionId);
    if (emailSent) {
      console.log('✅ Email enviado al paciente exitosamente');
      results.emailsSent++;
    } else {
      console.log('⚠️ No se pudo enviar email al paciente');
    }
    
    // Obtener ID del médico para notificación
    const doctorId = Array.isArray(session.selectedRecord.fields?.Médico) 
      ? session.selectedRecord.fields.Médico[0] 
      : session.selectedRecord.fields?.Médico;
    
    if (doctorId) {
      // Enviar notificación al médico (email + WhatsApp)
      const doctorNotified = await emailService.sendDoctorNotification(session, doctorId);
      if (doctorNotified) {
        console.log('✅ Médico notificado exitosamente');
        results.emailsSent++;
        results.whatsappSent = true;
      } else {
        console.log('⚠️ No se pudo notificar al médico');
      }
    } else {
      console.log('⚠️ No se pudo obtener ID del médico para notificación');
    }

    // Limpiar la sesión del bot (ya no es necesaria)
    sessionManager.deleteSession(sessionId);
    console.log('🧹 Sesión del bot limpiada');

    // 4. RESPUESTA FINAL
    return NextResponse.json({
      success: true,
      transactionId,
      reservationConfirmed: true,
      sobrecupoUpdated: results.sobrecupoUpdated,
      patientCreated: results.patientCreated,
      emailsSent: results.emailsSent,
      whatsappSent: results.whatsappSent,
      message: 'Reserva confirmada exitosamente',
      appointmentDetails: {
        patientName: paymentData.patientName,
        doctorName: paymentData.doctorName,
        specialty: paymentData.specialty,
        date: paymentData.date,
        time: paymentData.time,
        clinic: paymentData.clinic
      }
    });

  } catch (error) {
    console.error('❌ Error en confirmación de pago:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
      details: error.stack
    }, { status: 500 });
  }
}