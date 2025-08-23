// API SIMPLIFICADA para confirmar pago simulado del bot
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { transactionId, sessionId, paymentData, isSimulated } = await req.json();
    
    console.log('💳 === CONFIRMANDO PAGO SIMULADO (BOT) ===');
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

    // Para el bot simulado, solo necesitamos simular las acciones
    if (isSimulated) {
      console.log('🎭 Procesando pago simulado...');
      
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 1. Simular confirmación de reserva en Airtable
      console.log('✅ Reserva confirmada en Airtable (simulado)');
      
      // 2. Simular creación de paciente
      console.log('✅ Paciente creado/actualizado (simulado)');
      
      // 3. Simular envío de emails
      console.log('📧 Enviando email al paciente (simulado):', paymentData.patientEmail);
      console.log('📧 Enviando email al médico (simulado)');
      
      // 4. Simular envío de WhatsApp al médico
      console.log('📱 Enviando WhatsApp al médico (simulado)');
      const whatsappMessage = `
🩺 *NUEVA RESERVA CONFIRMADA*

👤 *Paciente:* ${paymentData.patientName}
📞 *Teléfono:* ${paymentData.patientPhone}
📧 *Email:* ${paymentData.patientEmail}
🎂 *Edad:* ${paymentData.patientAge} años

📅 *Cita programada:*
• *Fecha:* ${paymentData.date}
• *Hora:* ${paymentData.time}  
• *Especialidad:* ${paymentData.specialty}
• *Clínica:* ${paymentData.clinic}

💰 *Pago confirmado:* $${paymentData.amount} CLP
🔗 *ID:* ${transactionId}

✅ La cita está confirmada y el pago procesado.

_Sistema Sobrecupos_
      `.trim();
      
      console.log('📱 Contenido WhatsApp simulado:', whatsappMessage.substring(0, 100) + '...');

      // 5. Respuesta exitosa simulada
      return NextResponse.json({
        success: true,
        transactionId,
        reservationConfirmed: true,
        emailsSent: 2, // Paciente y médico
        whatsappSent: true,
        message: 'Reserva confirmada exitosamente (simulado)',
        appointmentDetails: {
          patientName: paymentData.patientName,
          doctorName: paymentData.doctorName,
          specialty: paymentData.specialty,
          date: paymentData.date,
          time: paymentData.time,
          clinic: paymentData.clinic
        }
      });
    }

    // Si no es simulado, devolver error (requiere implementación completa)
    return NextResponse.json({
      success: false,
      error: 'Pago real no implementado en esta versión'
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Error en confirmación de pago:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}