// app/api/payment/simulate/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { 
      sobrecupoId, 
      patientData, 
      appointmentData, 
      paymentAmount = "2990" // Precio por defecto actualizado
    } = await req.json();

    console.log('💳 Simulando pago:', {
      sobrecupoId,
      amount: paymentAmount,
      patient: patientData.name
    });

    // Validar datos requeridos
    if (!sobrecupoId || !patientData || !paymentAmount) {
      return NextResponse.json({
        success: false,
        error: 'Datos incompletos para el pago'
      }, { status: 400 });
    }

    // Simular delay de procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular éxito del pago (100% para testing - cambiar a Math.random() > 0.05 en producción)
    const paymentSuccess = true; // Math.random() > 0.05;

    if (paymentSuccess) {
      // Generar ID de transacción simulado
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      console.log('✅ Pago simulado exitoso:', transactionId);

      return NextResponse.json({
        success: true,
        transactionId,
        paymentDetails: {
          amount: paymentAmount,
          currency: 'CLP',
          method: 'Tarjeta simulada',
          timestamp: new Date().toISOString()
        },
        message: '¡Pago procesado exitosamente!'
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