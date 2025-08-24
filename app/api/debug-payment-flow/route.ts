// Debug endpoint para rastrear flujo de pagos
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('🔍 === DEBUG PAYMENT FLOW ===');
    console.log('🔍 Request body:', JSON.stringify(body, null, 2));
    console.log('🔍 Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
    console.log('🔍 URL:', req.url);
    console.log('🔍 Method:', req.method);
    console.log('🔍 Timestamp:', new Date().toISOString());
    
    return NextResponse.json({
      success: true,
      message: 'Debug endpoint reached successfully',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error in debug payment flow:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  console.log('🔍 Debug payment flow GET request received');
  return NextResponse.json({
    message: 'Debug payment flow endpoint is active',
    timestamp: new Date().toISOString()
  });
}