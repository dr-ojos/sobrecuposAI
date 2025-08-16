import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 Test básico iniciado');
  
  try {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
    
    console.log('Variables encontradas:', {
      SENDGRID_API_KEY: SENDGRID_API_KEY ? 'SET' : 'NOT SET',
      SENDGRID_FROM_EMAIL: SENDGRID_FROM_EMAIL || 'NOT SET'
    });
    
    return NextResponse.json({
      success: true,
      message: "Test básico funcionando",
      env: {
        SENDGRID_API_KEY: SENDGRID_API_KEY ? 'CONFIGURED' : 'MISSING',
        SENDGRID_FROM_EMAIL: SENDGRID_FROM_EMAIL || 'MISSING',
        NODE_ENV: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en test básico:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}