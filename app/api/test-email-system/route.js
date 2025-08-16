import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 === DIAGNOSTICO SISTEMA EMAIL ===');
    
    // 1. Verificar variables de entorno
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
    
    console.log('Variables:', {
      SENDGRID_API_KEY: SENDGRID_API_KEY ? `${SENDGRID_API_KEY.substring(0, 10)}...` : 'MISSING',
      SENDGRID_FROM_EMAIL: SENDGRID_FROM_EMAIL || 'MISSING'
    });

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return NextResponse.json({
        success: false,
        error: 'Variables de entorno faltantes',
        details: { SENDGRID_API_KEY: !!SENDGRID_API_KEY, SENDGRID_FROM_EMAIL: !!SENDGRID_FROM_EMAIL }
      });
    }

    // 2. Test básico de conectividad con SendGrid
    console.log('🔗 Probando conectividad SendGrid...');
    
    const testPayload = {
      personalizations: [{
        to: [{ email: "jose@sobrecupos.com", name: "Test Sobrecupos" }],
        subject: `🧪 Test Diagnóstico - ${new Date().toISOString()}`
      }],
      from: { email: SENDGRID_FROM_EMAIL, name: "SobrecuposIA Diagnóstico" },
      content: [{
        type: "text/plain",
        value: `Test de diagnóstico realizado el ${new Date().toISOString()}\n\nSi recibes este email, el sistema de emails está funcionando correctamente.`
      }]
    };

    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    // 3. Analizar respuesta
    if (response.ok) {
      console.log('✅ SendGrid respondió exitosamente');
      return NextResponse.json({
        success: true,
        message: "Test de email exitoso",
        details: {
          status: response.status,
          timestamp: new Date().toISOString(),
          to: "jose@sobrecupos.com",
          from: SENDGRID_FROM_EMAIL,
          sendgrid_response: "OK"
        }
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Error SendGrid:', errorText);
      console.error('❌ Status:', response.status);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { raw: errorText };
      }
      
      return NextResponse.json({
        success: false,
        error: "Error en SendGrid",
        details: {
          status: response.status,
          error: errorDetails,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

export async function POST() {
  return GET();
}