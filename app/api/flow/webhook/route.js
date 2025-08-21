// app/api/flow/webhook/route.js
import { NextResponse } from 'next/server';
import FlowPaymentService from '../../../../lib/flow-payment-service.js';

const flowService = new FlowPaymentService();

export async function POST(req) {
  try {
    console.log('🔔 [FLOW WEBHOOK] Recibiendo confirmación de pago...');

    // Obtener datos del webhook
    const body = await req.text();
    const formData = new URLSearchParams(body);
    const webhookData = Object.fromEntries(formData);
    
    console.log('📦 [FLOW WEBHOOK] Datos recibidos:', webhookData);

    // Validar la firma del webhook
    const validation = flowService.validatePaymentConfirmation(webhookData);
    
    if (!validation.isValid) {
      console.error('❌ [FLOW WEBHOOK] Firma inválida');
      return NextResponse.json({ 
        error: 'Firma inválida' 
      }, { status: 400 });
    }

    console.log('✅ [FLOW WEBHOOK] Firma validada correctamente');

    const { token, commerceOrder, status } = validation.paymentData;

    // Solo procesar pagos exitosos
    if (status !== '2') { // 2 = pagado en Flow
      console.log(`⚠️ [FLOW WEBHOOK] Estado no exitoso: ${status}`);
      return NextResponse.json({ received: true });
    }

    // Obtener detalles completos del pago
    const paymentDetails = await flowService.getPaymentStatus(token);
    
    if (!paymentDetails.success) {
      console.error('❌ [FLOW WEBHOOK] Error obteniendo detalles del pago');
      return NextResponse.json({ 
        error: 'Error obteniendo detalles del pago' 
      }, { status: 500 });
    }

    console.log('💰 [FLOW WEBHOOK] Detalles del pago:', paymentDetails);

    // Extraer sessionId del commerceOrder (formato: sessionId-timestamp)
    const sessionId = commerceOrder.split('-')[0];
    
    // Confirmar la reserva usando el endpoint existente
    const confirmPayload = {
      sessionId,
      transactionId: token,
      sobrecupoId: paymentDetails.paymentData?.subject || 'FLOW-PAYMENT',
      motivo: null,
      patientData: {
        name: paymentDetails.payer?.name || 'Paciente Flow',
        email: paymentDetails.payer?.email || 'Sin email',
        rut: 'N/A',
        phone: 'N/A',
        age: 'N/A'
      },
      appointmentData: {
        doctor: 'Médico',
        specialty: 'Especialidad',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-CL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        clinic: 'Clínica',
        amount: paymentDetails.amount
      },
      paymentMethod: 'flow',
      flowData: {
        token,
        commerceOrder,
        flowOrder: paymentDetails.paymentData?.flowOrder,
        payer: paymentDetails.payer
      }
    };

    console.log('🔄 [FLOW WEBHOOK] Confirmando reserva...');

    // Llamar al endpoint de confirmación existente
    const confirmResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/payment/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmPayload)
    });

    const confirmResult = await confirmResponse.json();

    if (confirmResult.success) {
      console.log('✅ [FLOW WEBHOOK] Reserva confirmada exitosamente');
      return NextResponse.json({ 
        received: true, 
        processed: true 
      });
    } else {
      console.error('❌ [FLOW WEBHOOK] Error confirmando reserva:', confirmResult);
      return NextResponse.json({ 
        received: true, 
        processed: false,
        error: confirmResult.error 
      });
    }

  } catch (error) {
    console.error('❌ [FLOW WEBHOOK] Error procesando webhook:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}

// Permitir solo POST
export async function GET() {
  return NextResponse.json({ 
    error: 'Método no permitido' 
  }, { status: 405 });
}