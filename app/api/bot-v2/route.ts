// Nueva API route del bot refactorizado
import { NextRequest } from 'next/server';
import { sobrecuposBot } from '../../../lib/bot/bot-main';

// Exportar el handler POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId } = body;

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ 
          text: "Error: Se requiere mensaje y sessionId" 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Procesar mensaje con el bot refactorizado
    return await sobrecuposBot.processMessage(message, sessionId);
    
  } catch (error) {
    console.error('❌ Error en bot-v2 route:', error);
    
    return new Response(
      JSON.stringify({ 
        text: "Lo siento, hubo un error interno. Por favor, intenta nuevamente." 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}