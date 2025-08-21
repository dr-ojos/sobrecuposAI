// app/api/flow/check-payment/route.js
import { NextResponse } from 'next/server';
import FlowPaymentService from '../../../../lib/flow-payment-service.js';

const flowService = new FlowPaymentService();

export async function POST(req) {
  try {
    console.log('🔍 [FLOW CHECK] Verificando estado del pago...');

    const { token, sessionId, commerceOrder } = await req.json();

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token de pago requerido'
      }, { status: 400 });
    }

    console.log('📋 [FLOW CHECK] Verificando token:', token);

    // Obtener estado del pago desde Flow.cl
    const paymentStatus = await flowService.getPaymentStatus(token);

    if (!paymentStatus.success) {
      console.error('❌ [FLOW CHECK] Error obteniendo estado:', paymentStatus);
      return NextResponse.json({
        success: false,
        error: 'Error verificando estado del pago'
      }, { status: 500 });
    }

    console.log('💰 [FLOW CHECK] Estado del pago:', paymentStatus);

    // Verificar si el pago fue exitoso
    if (paymentStatus.status === '2') { // 2 = pagado en Flow
      console.log('✅ [FLOW CHECK] Pago confirmado como exitoso');
      
      return NextResponse.json({
        success: true,
        status: 'paid',
        paymentDetails: {
          token,
          amount: paymentStatus.amount,
          commerceOrder: paymentStatus.commerceOrder,
          payer: paymentStatus.payer,
          paymentData: paymentStatus.paymentData
        }
      });
    } else {
      console.log(`⚠️ [FLOW CHECK] Pago no exitoso, estado: ${paymentStatus.status}`);
      
      return NextResponse.json({
        success: false,
        status: 'pending',
        error: 'El pago aún no ha sido confirmado'
      });
    }

  } catch (error) {
    console.error('❌ [FLOW CHECK] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Permitir solo POST
export async function GET() {
  return NextResponse.json({ 
    error: 'Método no permitido' 
  }, { status: 405 });
}