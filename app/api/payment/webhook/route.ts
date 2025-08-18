// app/api/payment/webhook/route.ts - Webhook de pagos en TypeScript
import { NextRequest, NextResponse } from 'next/server';
import type { PaymentWebhookData } from '../../../../types/payment';

interface WebhookRequest {
  sessionId: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  amount?: number;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
  sessionUpdated?: boolean;
}

// Storage en memoria para las sesiones del bot (simulando la variable sessions del bot)
// En producción esto debería estar en una base de datos compartida
const sessions: Record<string, any> = {};

// POST: Procesar webhook de pago
export async function POST(request: NextRequest): Promise<NextResponse<WebhookResponse>> {
  try {
    const webhookData: WebhookRequest = await request.json();
    const { sessionId, transactionId, status, error: paymentError, amount, paymentMethod, metadata } = webhookData;

    console.log('🔔 Payment webhook recibido:', {
      sessionId,
      transactionId,
      status,
      amount: amount ? `$${amount}` : undefined
    });

    // Validar datos requeridos
    if (!sessionId || !status) {
      return NextResponse.json({
        success: false,
        error: 'SessionId y status son requeridos'
      }, { status: 400 });
    }

    // Validar estado de pago
    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Buscar sesión activa por sessionId
    let sessionKey: string | null = null;
    let session: any = null;

    // En un sistema real, esto sería una consulta a la base de datos
    for (const [key, value] of Object.entries(sessions)) {
      if (value && typeof value === 'object' && value.id === sessionId) {
        sessionKey = key;
        session = value;
        break;
      }
    }

    if (!session) {
      console.log('⚠️ Sesión no encontrada para webhook:', sessionId);
      // No es necesariamente un error, la sesión puede haber expirado
      return NextResponse.json({
        success: true,
        message: 'Webhook procesado (sesión no encontrada)',
        sessionUpdated: false
      });
    }

    // Actualizar sesión según el estado del pago
    const now = new Date();
    let sessionUpdated = false;

    switch (status) {
      case 'completed':
        session.paymentStatus = 'completed';
        session.transactionId = transactionId;
        session.paidAt = now;
        session.paymentMethod = paymentMethod;
        session.amount = amount;
        sessionUpdated = true;
        
        console.log('✅ Pago completado para sesión:', sessionId, transactionId ? `(${transactionId})` : '');
        
        // Aquí se podría enviar confirmación por WhatsApp o email
        break;

      case 'failed':
        session.paymentStatus = 'failed';
        session.paymentError = paymentError;
        session.failedAt = now;
        sessionUpdated = true;
        
        console.log('❌ Pago fallido para sesión:', sessionId, paymentError || 'Sin detalles');
        break;

      case 'cancelled':
        session.paymentStatus = 'cancelled';
        session.cancelledAt = now;
        sessionUpdated = true;
        
        console.log('🚫 Pago cancelado para sesión:', sessionId);
        break;

      case 'pending':
        session.paymentStatus = 'pending';
        session.transactionId = transactionId;
        session.pendingAt = now;
        sessionUpdated = true;
        
        console.log('⏳ Pago pendiente para sesión:', sessionId, transactionId ? `(${transactionId})` : '');
        break;

      default:
        console.log('⚠️ Estado de pago no manejado:', status);
        break;
    }

    // Agregar metadata si está presente
    if (metadata && sessionUpdated) {
      session.paymentMetadata = metadata;
    }

    // Actualizar timestamp de último update
    if (sessionUpdated && sessionKey) {
      session.lastPaymentUpdate = now;
      sessions[sessionKey] = session;
    }

    // Log para debugging
    console.log('📊 Estado de sesión actualizado:', {
      sessionId,
      paymentStatus: session.paymentStatus,
      updated: sessionUpdated
    });

    return NextResponse.json({
      success: true,
      message: `Webhook procesado exitosamente - Estado: ${status}`,
      sessionUpdated
    });

  } catch (error) {
    console.error('❌ Error procesando webhook de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET: Obtener estado de pago de una sesión (útil para debugging)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'SessionId requerido'
      }, { status: 400 });
    }

    // Buscar sesión
    let session: any = null;
    for (const value of Object.values(sessions)) {
      if (value && typeof value === 'object' && value.id === sessionId) {
        session = value;
        break;
      }
    }

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Sesión no encontrada'
      }, { status: 404 });
    }

    // Retornar información de pago (sin datos sensibles)
    const paymentInfo = {
      sessionId: session.id,
      paymentStatus: session.paymentStatus || 'not_started',
      transactionId: session.transactionId,
      amount: session.amount,
      paymentMethod: session.paymentMethod,
      paidAt: session.paidAt,
      failedAt: session.failedAt,
      cancelledAt: session.cancelledAt,
      pendingAt: session.pendingAt,
      lastPaymentUpdate: session.lastPaymentUpdate
    };

    return NextResponse.json({
      success: true,
      data: paymentInfo
    });

  } catch (error) {
    console.error('❌ Error obteniendo estado de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}