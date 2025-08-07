// app/api/test-whatsapp/route.js
import { NextResponse } from 'next/server';
import whatsAppService from '../../../lib/whatsapp-service';

export async function POST(req) {
  try {
    const { testNumber } = await req.json();
    
    if (!testNumber) {
      return NextResponse.json({ 
        error: 'Número de prueba requerido' 
      }, { status: 400 });
    }

    console.log('🧪 Probando WhatsApp a:', testNumber);

    // Mensaje de prueba
    const testMessage = `🧪 PRUEBA SOBRECUPOS AI

¡Hola! Este es un mensaje de prueba del sistema.

✅ Las credenciales de Twilio están funcionando correctamente.
📱 El servicio de WhatsApp está operativo.

Timestamp: ${new Date().toLocaleString('es-CL')}

_Sistema Sobrecupos AI_`;

    const result = await whatsAppService.sendMessage(testNumber, testMessage);

    return NextResponse.json({
      success: true,
      result: result,
      message: result.simulated ? 
        'Mensaje simulado (modo desarrollo)' : 
        'Mensaje enviado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error test WhatsApp:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.code || 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET() {
  // Verificar configuración sin enviar mensaje
  const configured = !!(
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_WHATSAPP_NUMBER
  );

  return NextResponse.json({
    configured,
    twilioConfigured: configured,
    accountSid: process.env.TWILIO_ACCOUNT_SID ? 
      process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 
      'No configurado',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'No configurado',
    environment: process.env.NODE_ENV || 'development'
  });
}