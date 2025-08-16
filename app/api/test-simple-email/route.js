import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    console.log('🔧 Verificando variables de entorno...');
    console.log('SENDGRID_API_KEY:', SENDGRID_API_KEY ? 'Configurado' : 'NO CONFIGURADO');
    console.log('SENDGRID_FROM_EMAIL:', SENDGRID_FROM_EMAIL || 'NO CONFIGURADO');

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return NextResponse.json({
        success: false,
        error: 'Variables SendGrid faltantes',
        variables: {
          SENDGRID_API_KEY: SENDGRID_API_KEY ? 'OK' : 'MISSING',
          SENDGRID_FROM_EMAIL: SENDGRID_FROM_EMAIL || 'MISSING'
        }
      });
    }

    console.log('📧 Enviando email simple...');
    
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: "jose@sobrecupos.com" }],
          subject: "Test Simple Email"
        }],
        from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos Test" },
        content: [{
          type: "text/plain", 
          value: "Este es un test simple de SendGrid"
        }]
      })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Email enviado exitosamente"
      });
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      
      return NextResponse.json({
        success: false,
        error: "Error enviando email",
        status: response.status,
        details: errorText
      });
    }

  } catch (error) {
    console.error('Error general:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}