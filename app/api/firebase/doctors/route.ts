// API Firebase para médicos
import { NextResponse } from 'next/server';
import { firebaseService } from '@/lib/firebase/firestore-service';

// GET - Obtener todos los médicos
export async function GET() {
  try {
    console.log('🔥 === OBTENIENDO MÉDICOS DESDE FIREBASE ===');
    
    const doctors = await firebaseService.fetchAllDoctors();
    
    console.log(`✅ Firebase: ${doctors.length} médicos obtenidos`);
    
    return NextResponse.json({
      success: true,
      records: doctors
    });

  } catch (error) {
    console.error('❌ Error en Firebase doctors GET:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo médicos de Firebase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}