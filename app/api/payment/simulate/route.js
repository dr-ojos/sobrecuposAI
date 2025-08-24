// app/api/payment/simulate/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { 
      sobrecupoId, 
      sessionId,
      patientData, 
      appointmentData, 
      amount = "2990" // Precio por defecto actualizado
    } = await req.json();

    console.log('🎭 [SIMULATE] Simulando pago desde agendar:', {
      sobrecupoId,
      sessionId,
      amount,
      patientName: patientData?.name
    });

    // Validar datos requeridos para simulación desde agendar
    if (!sobrecupoId || !sessionId || !patientData?.name || !patientData?.email) {
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos para la simulación de pago'
      }, { status: 400 });
    }

    // Simular delay de procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular éxito del pago (100% para testing - cambiar a Math.random() > 0.05 en producción)
    const paymentSuccess = true; // Math.random() > 0.05;

    if (paymentSuccess) {
      // Generar ID de transacción simulado
      const transactionId = `SIM_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      console.log('✅ [SIMULATE] Pago simulado exitoso:', transactionId);

      // Construir URL de retorno con todos los datos necesarios para confirmar la reserva
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://sobrecupos-ai-esb7.vercel.app';
      const params = new URLSearchParams({
        transactionId,
        sessionId,
        simulated: 'true',
        // Datos del paciente
        patient: patientData.name,
        patientEmail: patientData.email || '',
        patientRut: patientData.rut || '',
        patientAge: patientData.age || '',
        patientPhone: patientData.phone || '',
        // Datos de la cita
        doctor: appointmentData?.doctor || '',
        doctorId: appointmentData?.doctorId || '',
        specialty: appointmentData?.specialty || '',
        date: appointmentData?.date || '',
        time: appointmentData?.time || '',
        clinic: appointmentData?.clinic || '',
        clinicAddress: appointmentData?.clinicAddress || '',
        // Datos del pago
        amount,
        sobrecupoId,
        motivo: appointmentData?.motivo || ''
      });
      const returnUrl = `${baseUrl}/reserva-exitosa?${params.toString()}`;

      return NextResponse.json({
        success: true,
        transactionId,
        url: returnUrl, // URL para redirección
        paymentDetails: {
          amount,
          currency: 'CLP',
          method: 'Pago simulado (Demo)',
          timestamp: new Date().toISOString()
        },
        message: '¡Simulación de pago exitosa!'
      });

    } else {
      console.log('❌ Pago simulado falló');
      
      return NextResponse.json({
        success: false,
        error: 'Error procesando el pago. Intenta nuevamente.',
        errorCode: 'PAYMENT_DECLINED'
      }, { status: 402 });
    }

  } catch (error) {
    console.error('❌ Error en simulación de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET para verificar estado de pago
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.json({
      success: false,
      error: 'ID de transacción requerido'
    }, { status: 400 });
  }

  // Simular consulta de estado
  return NextResponse.json({
    success: true,
    transactionId,
    status: 'APPROVED',
    timestamp: new Date().toISOString()
  });
}