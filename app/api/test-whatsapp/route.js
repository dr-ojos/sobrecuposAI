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
    // Mensaje más simple para WhatsApp Business
    const testMessage = `Hola! Este es un mensaje de prueba de Sobrecupos AI.

Timestamp: ${new Date().toLocaleString('es-CL')}

Sistema Sobrecupos AI`;

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

  console.log('🔍 VERIFICANDO CONFIGURACIÓN TWILIO:');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Configurado' : 'NO configurado');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Configurado' : 'NO configurado');
  console.log('TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER ? 'Configurado' : 'NO configurado');

  return NextResponse.json({
    configured,
    twilioConfigured: configured,
    accountSid: process.env.TWILIO_ACCOUNT_SID ? 
      process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 
      'No configurado',
    authToken: process.env.TWILIO_AUTH_TOKEN ? 
      'Configurado (' + process.env.TWILIO_AUTH_TOKEN.length + ' chars)' : 
      'No configurado',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'No configurado',
    environment: process.env.NODE_ENV || 'development'
  });
}