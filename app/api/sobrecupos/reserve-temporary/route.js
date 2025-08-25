import { NextResponse } from 'next/server';

// API para reservar temporalmente un sobrecupo (con timeout de pago)
export async function POST(req) {
  try {
    const { sobrecupoId, sessionId, timeoutMinutes = 15 } = await req.json();

    if (!sobrecupoId || !sessionId) {
      return NextResponse.json(
        { error: 'sobrecupoId y sessionId son requeridos' }, 
        { status: 400 }
      );
    }

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = 'SobrecuposTest'; // Usar tabla correcta

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' }, 
        { status: 500 }
      );
    }

    // Calcular fecha límite de pago (timestamp)
    const paymentTimeout = new Date();
    paymentTimeout.setMinutes(paymentTimeout.getMinutes() + timeoutMinutes);
    const paymentTimeoutISO = paymentTimeout.toISOString();

    console.log('⏰ Configurando timeout de pago:', {
      sobrecupoId,
      sessionId,
      timeoutMinutes,
      paymentTimeoutISO
    });

    // Actualizar sobrecupo con estado temporal y timeout
    const updateData = {
      fields: {
        Disponible: "Reserva Temporal", // Estado temporal
        "Session ID": sessionId,
        "Payment Timeout": paymentTimeoutISO,
        "Reserva Timestamp": new Date().toISOString()
      }
    };

    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error reservando sobrecupo:', errorData);
      return NextResponse.json(
        { 
          error: 'Error actualizando sobrecupo',
          details: errorData.error?.message 
        }, 
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('✅ Sobrecupo reservado temporalmente:', result.id);

    return NextResponse.json({
      success: true,
      message: `Sobrecupo reservado por ${timeoutMinutes} minutos`,
      sobrecupoId: result.id,
      sessionId,
      paymentTimeout: paymentTimeoutISO,
      timeoutMinutes
    });

  } catch (error) {
    console.error('❌ Error en /api/sobrecupos/reserve-temporary:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}