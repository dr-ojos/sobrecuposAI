// app/api/debug-whatsapp/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { testNumber } = await req.json();
    
    console.log('🔍 === DEBUG WHATSAPP ===');
    console.log('Environment variables:');
    console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'NOT SET');
    console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'NOT SET'); 
    console.log('TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER);
    
    // Test directo con Twilio
    try {
      const { default: twilio } = await import('twilio');
      
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID, 
        process.env.TWILIO_AUTH_TOKEN
      );
      
      console.log('✅ Twilio client created successfully');
      
      // Formatear número
      let formattedNumber = testNumber;
      if (!formattedNumber.startsWith('+')) {
        if (formattedNumber.startsWith('9')) {
          formattedNumber = `+56${formattedNumber}`;
        } else {
          formattedNumber = `+569${formattedNumber}`;
        }
      }
      
      console.log('📱 Sending to:', formattedNumber);
      console.log('📤 From:', process.env.TWILIO_WHATSAPP_NUMBER);
      
      const message = await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${formattedNumber}`,
        body: `🧪 PRUEBA DEBUG DIRECTA

¡Hola! Si recibes este mensaje, Twilio está funcionando correctamente.

Timestamp: ${new Date().toLocaleString('es-CL')}
Número destino: ${formattedNumber}

Sistema Sobrecupos AI`
      });
      
      console.log('✅ Message sent successfully!');
      console.log('Message SID:', message.sid);
      console.log('Status:', message.status);
      
      return NextResponse.json({
        success: true,
        messageSid: message.sid,
        status: message.status,
        to: formattedNumber,
        from: process.env.TWILIO_WHATSAPP_NUMBER
      });
      
    } catch (twilioError) {
      console.error('❌ Twilio Error:', twilioError);
      
      return NextResponse.json({
        success: false,
        error: 'Twilio Error',
        details: {
          message: twilioError.message,
          code: twilioError.code,
          moreInfo: twilioError.moreInfo,
          status: twilioError.status
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ General Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'General Error',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Debug Endpoint',
    usage: 'POST with { testNumber: "+56912345678" }',
    timestamp: new Date().toISOString()
  });
}