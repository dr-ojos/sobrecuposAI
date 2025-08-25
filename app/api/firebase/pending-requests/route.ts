// API Firebase para solicitudes pendientes
import { NextResponse } from 'next/server';
import { firebaseService } from '@/lib/firebase/firestore-service';

// GET - Obtener todas las solicitudes pendientes
export async function GET() {
  try {
    console.log('🔥 === OBTENIENDO SOLICITUDES PENDIENTES DESDE FIREBASE ===');
    
    const requests = await firebaseService.fetchPendingRequests();
    
    console.log(`✅ Firebase: ${requests.length} solicitudes obtenidas`);
    
    return NextResponse.json({
      success: true,
      records: requests
    });

  } catch (error) {
    console.error('❌ Error en Firebase pending requests GET:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo solicitudes pendientes de Firebase'
    }, { status: 500 });
  }
}

// POST - Crear nueva solicitud pendiente
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      patientName, 
      patientEmail, 
      patientPhone,
      patientAge,
      patientRut,
      requestedSpecialty,
      motivo,
      sessionId
    } = body;

    // Validar campos requeridos
    if (!patientName || !requestedSpecialty) {
      return NextResponse.json({
        success: false,
        error: 'Nombre del paciente y especialidad son requeridos'
      }, { status: 400 });
    }

    // Crear solicitud en Firebase
    const requestData = {
      PatientName: patientName,
      PatientEmail: patientEmail || '',
      PatientPhone: patientPhone || '',
      PatientAge: patientAge ? parseInt(patientAge.toString()) : null,
      PatientRut: patientRut || '',
      RequestedSpecialty: requestedSpecialty,
      Motivo: motivo || '',
      RequestDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      SessionId: sessionId || ''
    };

    console.log('🔥 Creando solicitud pendiente en Firebase:', requestData);

    const requestId = await firebaseService.createPendingRequest(requestData);

    if (!requestId) {
      return NextResponse.json({
        success: false,
        error: 'Error creando solicitud pendiente en Firebase'
      }, { status: 500 });
    }

    console.log('✅ Solicitud pendiente creada en Firebase:', requestId);

    return NextResponse.json({
      success: true,
      id: requestId,
      message: 'Solicitud pendiente creada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en Firebase pending requests POST:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// DELETE - Eliminar solicitud pendiente
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('id');

    if (!requestId) {
      return NextResponse.json({
        success: false,
        error: 'ID de solicitud requerido'
      }, { status: 400 });
    }

    const success = await firebaseService.deletePendingRequest(requestId);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Error eliminando solicitud pendiente'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud pendiente eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en Firebase pending requests DELETE:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}