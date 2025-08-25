// API Firebase para sobrecupos - Reemplaza funcionalidad de Airtable
import { NextResponse } from 'next/server';
import { firebaseService } from '@/lib/firebase/firestore-service';

// GET - Obtener todos los sobrecupos
export async function GET() {
  try {
    console.log('🔥 === OBTENIENDO SOBRECUPOS DESDE FIREBASE ===');
    
    const sobrecupos = await firebaseService.fetchAllSobrecupos();
    
    console.log(`✅ Firebase: ${sobrecupos.length} sobrecupos obtenidos`);
    
    return NextResponse.json({
      success: true,
      records: sobrecupos
    });

  } catch (error) {
    console.error('❌ Error en Firebase sobrecupos GET:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo sobrecupos de Firebase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Crear nuevo sobrecupo
export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    console.log('🔥 === CREANDO SOBRECUPO EN FIREBASE ===', data);
    
    // Aquí implementarías la lógica de creación
    // Por ahora solo log para testing
    
    return NextResponse.json({
      success: true,
      message: 'Sobrecupo creado en Firebase'
    });

  } catch (error) {
    console.error('❌ Error creando sobrecupo en Firebase:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error creando sobrecupo',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}