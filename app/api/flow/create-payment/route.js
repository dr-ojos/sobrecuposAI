// app/api/flow/create-payment/route.js
import { NextResponse } from 'next/server';
import FlowPaymentService from '../../../../lib/flow-payment-service.js';

const flowService = new FlowPaymentService();

export async function POST(req) {
  try {
    console.log('💳 [FLOW CREATE] Iniciando creación de orden de pago...');

    const { 
      sobrecupoId, 
      sessionId, 
      patientData, 
      appointmentData, 
      amount 
    } = await req.json();

    // Validar datos requeridos
    if (!sobrecupoId || !sessionId || !patientData?.email || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Datos insuficientes para crear la orden de pago'
      }, { status: 400 });
    }

    console.log('📋 [FLOW CREATE] Datos recibidos:', {
      sobrecupoId,
      sessionId,
      amount,
      patientEmail: patientData.email
    });

    // Generar commerceOrder único
    const commerceOrder = `${sessionId}-${Date.now()}`;
    
    // Construir subject descriptivo
    const subject = `Sobrecupo ${appointmentData?.doctor || 'Médico'} - ${appointmentData?.date || 'Fecha'} ${appointmentData?.time || 'Hora'}`;

    // URLs de confirmación y retorno
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const urlConfirmation = `${baseUrl}/api/flow/webhook`;
    const urlReturn = `${baseUrl}/flow/return?sessionId=${sessionId}&commerceOrder=${commerceOrder}`;

    console.log('🔗 [FLOW CREATE] URLs configuradas:', {
      urlConfirmation,
      urlReturn
    });

    // Crear orden en Flow.cl
    const paymentOrder = await flowService.createPaymentOrder({
      commerceOrder,
      subject,
      currency: 'CLP',
      amount: parseInt(amount),
      email: patientData.email,
      paymentMethod: 9, // Todos los medios de pago
      urlConfirmation,
      urlReturn
    });

    if (!paymentOrder.success) {
      console.error('❌ [FLOW CREATE] Error creando orden:', paymentOrder);
      return NextResponse.json({
        success: false,
        error: 'Error creando orden de pago en Flow.cl'
      }, { status: 500 });
    }

    console.log('✅ [FLOW CREATE] Orden creada exitosamente:', {
      token: paymentOrder.token,
      url: paymentOrder.url,
      flowOrder: paymentOrder.flowOrder
    });

    return NextResponse.json({
      success: true,
      token: paymentOrder.token,
      url: paymentOrder.url,
      commerceOrder,
      flowOrder: paymentOrder.flowOrder
    });

  } catch (error) {
    console.error('❌ [FLOW CREATE] Error:', error);
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