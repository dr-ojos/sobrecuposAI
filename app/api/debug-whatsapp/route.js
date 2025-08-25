// Debug endpoint para verificar WhatsApp
export async function POST(req) {
  try {
    const { phoneNumber } = await req.json();
    
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

    console.log('🔍 Debug WhatsApp:', {
      TWILIO_ACCOUNT_SID: TWILIO_ACCOUNT_SID ? 'Configurado' : 'NO CONFIGURADO',
      TWILIO_AUTH_TOKEN: TWILIO_AUTH_TOKEN ? 'Configurado' : 'NO CONFIGURADO', 
      TWILIO_WHATSAPP_NUMBER: TWILIO_WHATSAPP_NUMBER || 'NO CONFIGURADO',
      phoneNumber: phoneNumber
    });

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      return Response.json({
        success: false,
        error: 'Credenciales Twilio no configuradas',
        details: {
          TWILIO_ACCOUNT_SID: !!TWILIO_ACCOUNT_SID,
          TWILIO_AUTH_TOKEN: !!TWILIO_AUTH_TOKEN,
          TWILIO_WHATSAPP_NUMBER: !!TWILIO_WHATSAPP_NUMBER
        }
      });
    }

    // Test de envío
    const testMessage = `🧪 *MENSAJE DE PRUEBA*\n\nEste es un test del sistema de notificaciones médicas.\n\nFecha: ${new Date().toLocaleString('es-CL')}\n\n_Sistema Sobrecupos_`;
    
    const whatsappPayload = {
      From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
      To: `whatsapp:${phoneNumber}`,
      Body: testMessage
    };

    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const whatsappResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(whatsappPayload).toString()
      }
    );

    if (whatsappResponse.ok) {
      const result = await whatsappResponse.json();
      return Response.json({
        success: true,
        message: 'WhatsApp enviado exitosamente',
        twilioSid: result.sid,
        to: phoneNumber,
        from: TWILIO_WHATSAPP_NUMBER
      });
    } else {
      const errorText = await whatsappResponse.text();
      return Response.json({
        success: false,
        error: 'Error enviando WhatsApp',
        twilioError: errorText,
        statusCode: whatsappResponse.status
      });
    }

  } catch (error) {
    console.error('❌ Error en debug WhatsApp:', error);
    return Response.json({
      success: false,
      error: error.message
    });
  }
}