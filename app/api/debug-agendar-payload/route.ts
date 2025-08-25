// Endpoint para debuggear exactamente qué datos llegan desde agendar
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    console.log('🚨 === DEBUG PAYLOAD DESDE AGENDAR ===');
    console.log('📋 Payload completo:', JSON.stringify(payload, null, 2));
    console.log('🔍 doctorId específico:', payload.paymentData?.doctorId);
    console.log('🔍 doctorName específico:', payload.paymentData?.doctorName);
    console.log('🔍 fromChat específico:', payload.paymentData?.fromChat);
    console.log('🔍 sessionId específico:', payload.paymentData?.sessionId);
    
    return NextResponse.json({
      success: true,
      received: {
        doctorId: payload.paymentData?.doctorId,
        doctorName: payload.paymentData?.doctorName,
        fromChat: payload.paymentData?.fromChat,
        sessionId: payload.paymentData?.sessionId
      },
      fullPayload: payload
    });
    
  } catch (error: any) {
    console.error('❌ Error en debug:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}