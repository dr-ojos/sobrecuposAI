// API para probar delivery de notificaciones directamente
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, whatsapp, testType = 'both' } = await req.json();
    
    console.log('🧪 === TEST DE DELIVERY DE NOTIFICACIONES ===');
    console.log('📋 Email de prueba:', email);
    console.log('📋 WhatsApp de prueba:', whatsapp);
    console.log('📋 Tipo de test:', testType);

    const results = {
      emailResults: [] as Array<{
        attempt: number;
        success: boolean;
        timestamp: string;
        error: string | null;
        responseCode: number | null;
        messageId: string | null;
      }>,
      whatsappResults: [] as Array<{
        attempt: number;
        success: boolean;
        timestamp: string;
        error: string | null;
        messageId: string | null;
        status: string | null;
      }>,
      success: false,
      timestamp: new Date().toISOString()
    };

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    // TEST DE EMAIL
    if ((testType === 'email' || testType === 'both') && email && SENDGRID_API_KEY) {
      console.log('📧 Iniciando test de email...');
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        const attemptResult = {
          attempt,
          success: false,
          timestamp: new Date().toISOString(),
          error: null as string | null,
          responseCode: null as number | null,
          messageId: null as string | null
        };

        try {
          console.log(`📧 Test intento ${attempt}/3`);
          
          const testEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Test de Delivery - SobrecuposIA</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #f0f9ff; border: 2px solid #0369a1; border-radius: 8px; padding: 20px; text-align: center;">
                <h1 style="color: #0369a1; margin: 0 0 20px 0;">🧪 Test de Delivery Exitoso</h1>
                
                <p style="font-size: 16px; color: #333; margin: 15px 0;">
                  <strong>¡Este email llegó correctamente!</strong>
                </p>
                
                <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Intento:</strong> ${attempt}/3</p>
                  <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${attemptResult.timestamp}</p>
                  <p style="margin: 5px 0;"><strong>Sistema:</strong> Robusto con Reintentos</p>
                </div>
                
                <div style="margin: 20px 0; padding: 15px; background: #f0fdf4; border-radius: 6px;">
                  <h3 style="color: #166534; margin: 0 0 10px 0;">✅ Configuraciones Aplicadas:</h3>
                  <ul style="text-align: left; color: #166534; margin: 10px 0;">
                    <li>Categories: medical-notification, delivery-test</li>
                    <li>Reply-to configurado</li>
                    <li>Anti-spam optimizations</li>
                    <li>Custom args para tracking</li>
                  </ul>
                </div>

                <p style="font-size: 14px; color: #666; margin: 20px 0;">
                  Si ves este mensaje, las notificaciones de SobrecuposIA deberían llegar correctamente.
                </p>
                
                <div style="border-top: 1px solid #ccc; padding-top: 15px; margin-top: 20px;">
                  <p style="font-size: 12px; color: #999; margin: 0;">
                    Test generado por Sistema SobrecuposIA | ${attemptResult.timestamp}
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{
                to: [{ email: email }],
                subject: `🧪 Test Delivery SobrecuposIA - Intento ${attempt} - ${new Date().toLocaleTimeString()}`
              }],
              from: { 
                email: SENDGRID_FROM_EMAIL, 
                name: "Test Sistema Sobrecupos" 
              },
              reply_to: {
                email: SENDGRID_FROM_EMAIL,
                name: "Test Sistema Sobrecupos"
              },
              categories: ["medical-notification", "delivery-test", `test-attempt-${attempt}`],
              custom_args: {
                "test_type": "delivery_test",
                "attempt": attempt.toString(),
                "timestamp": attemptResult.timestamp,
                "target_email": email
              },
              content: [{
                type: "text/html",
                value: testEmailHtml
              }]
            })
          });

          attemptResult.responseCode = emailResponse.status;
          const responseText = await emailResponse.text();

          if (emailResponse.ok) {
            attemptResult.success = true;
            attemptResult.messageId = emailResponse.headers.get('X-Message-Id') || 'unknown';
            console.log(`✅ Email test intento ${attempt} exitoso`);
          } else {
            attemptResult.error = `SendGrid error: ${responseText}`;
            console.log(`❌ Email test intento ${attempt} falló: ${responseText}`);
          }

        } catch (error) {
          attemptResult.error = `Exception: ${error.message}`;
          console.log(`❌ Email test intento ${attempt} excepción:`, error.message);
        }

        results.emailResults.push(attemptResult);

        // Si fue exitoso, no seguir intentando
        if (attemptResult.success) {
          break;
        }

        // Esperar antes del siguiente intento
        if (attempt < 3) {
          console.log('⏳ Esperando 2 segundos...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // TEST DE WHATSAPP
    if ((testType === 'whatsapp' || testType === 'both') && whatsapp) {
      console.log('📱 Iniciando test de WhatsApp...');
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        const attemptResult = {
          attempt,
          success: false,
          timestamp: new Date().toISOString(),
          error: null as string | null,
          messageId: null as string | null,
          status: null as string | null
        };

        try {
          console.log(`📱 WhatsApp test intento ${attempt}/3`);
          
          const testMessage = `🧪 *TEST DE DELIVERY - SobrecuposIA*

¡Este mensaje llegó correctamente! ✅

📊 *Detalles del Test:*
• Intento: ${attempt}/3
• Timestamp: ${attemptResult.timestamp}
• Sistema: Robusto con Reintentos
• Número: ${whatsapp}

🎯 *Configuraciones:*
• Servicio: Twilio WhatsApp
• Reintentos automáticos
• Logging detallado
• Fallbacks configurados

Si ves este mensaje, las notificaciones de WhatsApp de SobrecuposIA funcionan correctamente.

_Test Sistema SobrecuposIA_`;

          const { default: whatsAppService } = await import('../../../lib/whatsapp-service.js');
          const whatsappResult = await whatsAppService.sendMessage(whatsapp, testMessage);

          if (whatsappResult.success) {
            attemptResult.success = true;
            attemptResult.messageId = whatsappResult.messageId || null;
            attemptResult.status = whatsappResult.status || null;
            console.log(`✅ WhatsApp test intento ${attempt} exitoso: ${whatsappResult.messageId}`);
          } else {
            attemptResult.error = whatsappResult.error || 'Error desconocido';
            console.log(`❌ WhatsApp test intento ${attempt} falló: ${attemptResult.error}`);
          }

        } catch (error) {
          attemptResult.error = `Exception: ${error.message}`;
          console.log(`❌ WhatsApp test intento ${attempt} excepción:`, error.message);
        }

        results.whatsappResults.push(attemptResult);

        // Si fue exitoso, no seguir intentando
        if (attemptResult.success) {
          break;
        }

        // Esperar antes del siguiente intento
        if (attempt < 3) {
          console.log('⏳ Esperando 2 segundos...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Determinar éxito general
    const emailSuccess = results.emailResults.length === 0 || results.emailResults.some(r => r.success);
    const whatsappSuccess = results.whatsappResults.length === 0 || results.whatsappResults.some(r => r.success);
    results.success = emailSuccess && whatsappSuccess;

    console.log('📊 Resultado final del test:', {
      email: emailSuccess ? '✅' : '❌',
      whatsapp: whatsappSuccess ? '✅' : '❌',
      overall: results.success ? '✅' : '❌'
    });

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ Error en test de delivery:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor',
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}