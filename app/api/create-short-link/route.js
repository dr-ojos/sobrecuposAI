// API para crear enlaces cortos de pago
import { NextResponse } from 'next/server';

// Almacenamiento temporal para links cortos (en producción usar base de datos)
const shortLinks = new Map();

export async function POST(request) {
  try {
    const { longUrl } = await request.json();
    
    if (!longUrl) {
      return NextResponse.json({ success: false, error: 'URL requerida' });
    }
    
    // Generar ID corto
    const shortId = generateShortId();
    
    // Guardar el mapeo
    shortLinks.set(shortId, {
      longUrl,
      createdAt: new Date(),
      clicks: 0
    });
    
    // Crear URL corta
    const shortUrl = `/p/${shortId}`;
    
    console.log('✅ Link corto creado:', shortId, '→', longUrl.substring(0, 100) + '...');
    
    return NextResponse.json({
      success: true,
      shortUrl,
      shortId,
      longUrl
    });
    
  } catch (error) {
    console.error('❌ Error creando link corto:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shortId = searchParams.get('id');
  
  if (!shortId) {
    return NextResponse.json({ success: false, error: 'ID requerido' });
  }
  
  const linkData = shortLinks.get(shortId);
  if (!linkData) {
    return NextResponse.json({ success: false, error: 'Link no encontrado' });
  }
  
  // Incrementar contador
  linkData.clicks++;
  
  return NextResponse.json({
    success: true,
    longUrl: linkData.longUrl,
    clicks: linkData.clicks,
    createdAt: linkData.createdAt
  });
}

function generateShortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}