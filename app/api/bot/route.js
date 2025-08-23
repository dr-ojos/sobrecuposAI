// Nueva API route del bot modular - reemplaza el sistema anterior
import { sobrecuposBot } from '../../../lib/bot/bot-main.ts';

// Manejo de mensajes POST
export async function POST(req) {
  try {
    const body = await req.json();
    let { message, phone } = body;

    console.log('📱 Mensaje recibido:', message);

    if (!message) {
      return new Response(
        JSON.stringify({ 
          text: "Error: Se requiere mensaje" 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Usar phone como sessionId si está disponible, sino crear uno temporal
    let sessionId = phone || `temp-${Date.now()}`;
    
    // Limpiar el sessionId (quitar caracteres especiales)
    sessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, '');

    // Procesar mensaje con el bot modular
    const response = await sobrecuposBot.processMessage(message, sessionId);
    return response;
    
  } catch (error) {
    console.error('❌ Error en bot route:', error);
    
    return new Response(
      JSON.stringify({ 
        text: "Lo siento, hubo un error procesando tu mensaje. Por favor intenta nuevamente.",
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Manejo de GET para verificación
export async function GET() {
  return new Response(
    JSON.stringify({ 
      message: "SobrecuposIA Bot API - Sistema Modular Activo",
      version: "2.0",
      status: "active"
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}