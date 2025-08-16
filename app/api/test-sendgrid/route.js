import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 === TEST SENDGRID ===');
  
  try {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    console.log('🔧 Variables de entorno:', {
      SENDGRID_API_KEY: SENDGRID_API_KEY ? '✅ Presente' : '❌ Faltante',
      SENDGRID_FROM_EMAIL: SENDGRID_FROM_EMAIL || '❌ No configurado'
    });

    if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
      return NextResponse.json({
        success: false,
        error: 'Variables de SendGrid no configuradas',
        details: {
          SENDGRID_API_KEY: SENDGRID_API_KEY ? 'OK' : 'MISSING',
          SENDGRID_FROM_EMAIL: SENDGRID_FROM_EMAIL || 'MISSING'
        }
      });
    }

    console.log('📧 Enviando email de prueba...');
    
    const testEmailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email - SobrecuposIA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 2rem; border-radius: 8px;">
    <h1 style="color: #171717; text-align: center;">🧪 Test SendGrid</h1>
    <p>Este es un email de prueba para verificar que SendGrid está funcionando correctamente.</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    <p><strong>Servidor:</strong> ${process.env.NODE_ENV || 'development'}</p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
      <p style="color: #166534; margin: 0; font-weight: bold;">✅ Si recibes este email, SendGrid está funcionando</p>
    </div>
  </div>
</body>
</html>`;

    const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: "jose@sobrecupos.com", name: "Test Sobrecupos" }],
          subject: `🧪 Test SendGrid - ${new Date().toISOString()}`
        }],
        from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI Test" },
        content: [{ type: "text/html", value: testEmailContent }]
      })
    });

    console.log('📡 SendGrid Response Status:', emailResponse.status);
    console.log('📡 SendGrid Response OK:', emailResponse.ok);

    if (emailResponse.ok) {
      console.log('✅ Email enviado exitosamente via SendGrid');
      return NextResponse.json({
        success: true,
        message: "Email de prueba enviado exitosamente",
        details: {
          status: emailResponse.status,
          to: "jose@sobrecupos.com",
          from: SENDGRID_FROM_EMAIL,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      const errorData = await emailResponse.text();
      console.error('❌ Error SendGrid:', errorData);
      
      return NextResponse.json({
        success: false,
        error: "Error enviando email via SendGrid",
        details: {
          status: emailResponse.status,
          error: errorData
        }
      });
    }

  } catch (error) {
    console.error('❌ Error en test SendGrid:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function POST() {
  return GET();
}