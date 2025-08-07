// app/api/payment/webhook/route.js
import { NextResponse } from 'next/server';

// Storage en memoria para las sesiones del bot (simulando la variable sessions del bot)
// En producción esto debería estar en una base de datos compartida
const sessions = {};

export async function POST(req) {
  try {
    const { sessionId, transactionId, status, error } = await req.json();

    console.log('🔔 Payment webhook recibido:', {
      sessionId,
      transactionId,
      status
    });

    // Validar datos requeridos
    if (!sessionId || !status) {
      return NextResponse.json({
        success: false,
        error: 'SessionId y status son requeridos'
      }, { status: 400 });
    }

    // Buscar sesión activa por sessionId
    let sessionKey = null;
    let session = null;

    // En un sistema real, esto sería una consulta a la base de datos
    // Por ahora, simulamos que podemos actualizar el estado de la sesión
    console.log('📝 Actualizando estado de sesión del chat...');

    // Según el status del pago, determinar el próximo estado
    let newStage = '';
    let responseMessage = '';

    switch (status) {
      case 'SUCCESS':
        newStage = 'payment-completed';
        responseMessage = `✅ ¡Pago confirmado exitosamente!\n\n💳 ID Transacción: ${transactionId}\n\n🎉 ¡Tu cita médica ha sido reservada!\n\nRecibirás un email de confirmación en breve con todos los detalles.\n\n¡Gracias por usar Sobrecupos AI!`;
        break;
        
      case 'ERROR':
        newStage = 'pending-payment';
        responseMessage = `❌ Error procesando el pago: ${error}\n\nPuedes intentar nuevamente o contactar soporte.`;
        break;
        
      case 'CANCELLED':
        newStage = 'pending-payment';
        responseMessage = `⚠️ Pago cancelado.\n\nPuedes intentar nuevamente cuando estés listo. Escribe "enlace" para obtener nuevamente el enlace de pago.`;
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Status no reconocido'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newStage,
      responseMessage,
      message: 'Webhook procesado correctamente'
    });

  } catch (error) {
    console.error('❌ Error procesando webhook de pago:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET para verificar estado del webhook
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Payment webhook endpoint activo'
  });
}