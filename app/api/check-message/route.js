// app/api/check-message/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messageSid } = await req.json();
    
    if (!messageSid) {
      return NextResponse.json({ 
        error: 'Message SID requerido' 
      }, { status: 400 });
    }

    console.log('🔍 Checking message status:', messageSid);

    // Inicializar Twilio
    const { default: twilio } = await import('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID, 
      process.env.TWILIO_AUTH_TOKEN
    );

    // Obtener detalles del mensaje
    const message = await client.messages(messageSid).fetch();
    
    console.log('📱 Message details:', {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      to: message.to,
      from: message.from,
      body: message.body.substring(0, 50) + '...',
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      direction: message.direction,
      price: message.price,
      priceUnit: message.priceUnit
    });

    return NextResponse.json({
      success: true,
      message: {
        sid: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        direction: message.direction,
        price: message.price,
        priceUnit: message.priceUnit,
        statusDescription: getStatusDescription(message.status, message.errorCode)
      }
    });

  } catch (error) {
    console.error('❌ Error checking message:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    }, { status: 500 });
  }
}

function getStatusDescription(status, errorCode) {
  const descriptions = {
    'accepted': 'Mensaje aceptado por Twilio',
    'queued': 'Mensaje en cola para envío',
    'sending': 'Enviando mensaje',
    'sent': 'Mensaje enviado al proveedor',
    'received': 'Proveedor confirmó recepción',
    'delivered': '✅ Mensaje entregado exitosamente',
    'undelivered': '❌ No se pudo entregar',
    'failed': '❌ Falló el envío',
    'read': '✅ Mensaje leído por el usuario'
  };
  
  let desc = descriptions[status] || `Status desconocido: ${status}`;
  
  if (errorCode) {
    desc += ` (Error ${errorCode})`;
  }
  
  return desc;
}

export async function GET() {
  return NextResponse.json({
    message: 'Message Status Checker',
    usage: 'POST with { messageSid: "SMxxxxxxxx" }',
    example: { messageSid: 'SM6bead35340b4911411ed36bae87d99f5' }
  });
}