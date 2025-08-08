// app/api/debug-whatsapp-doctor/route.js
import { NextResponse } from 'next/server';
import whatsAppService from '../../../lib/whatsapp-service';

export async function POST(req) {
  try {
    const { doctorId } = await req.json();
    
    if (!doctorId) {
      return NextResponse.json({ 
        error: 'ID de médico requerido' 
      }, { status: 400 });
    }

    console.log('🩺 === DEBUG WHATSAPP MEDICO ===');
    console.log('🩺 Doctor ID:', doctorId);

    // Obtener datos del médico desde Airtable
    const doctorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/sobrecupos/medicos/${doctorId}`);
    
    if (!doctorResponse.ok) {
      console.error('❌ Error obteniendo médico:', doctorResponse.status);
      return NextResponse.json({ 
        error: 'Médico no encontrado' 
      }, { status: 404 });
    }

    const doctorData = await doctorResponse.json();
    console.log('🩺 Doctor data completa:', JSON.stringify(doctorData, null, 2));
    console.log('🩺 Doctor WhatsApp:', doctorData.whatsapp);

    if (!doctorData.whatsapp) {
      console.log('❌ Médico NO tiene WhatsApp configurado');
      return NextResponse.json({
        success: false,
        error: 'Médico sin WhatsApp configurado',
        doctorData: doctorData
      });
    }

    // Datos de prueba para la notificación
    const testPatientData = {
      name: 'Paciente Test',
      rut: '12345678-9',
      phone: '+56912345678',
      email: 'test@test.com'
    };

    const testAppointmentData = {
      fecha: '2025-08-09',
      hora: '10:00',
      clinica: 'Clínica Test'
    };

    const testMotivo = 'Control de prueba';

    console.log('🩺 === ENVIANDO NOTIFICACIÓN DE PRUEBA ===');
    console.log('🩺 Test patient data:', testPatientData);
    console.log('🩺 Test appointment data:', testAppointmentData);
    console.log('🩺 Test motivo:', testMotivo);

    const result = await whatsAppService.notifyDoctorNewPatient(
      doctorData, 
      testPatientData, 
      testAppointmentData, 
      testMotivo
    );

    console.log('🩺 ✅ Resultado notificación:', result);

    return NextResponse.json({
      success: true,
      result: result,
      doctorData: {
        name: doctorData.name,
        whatsapp: doctorData.whatsapp,
        especialidad: doctorData.especialidad
      },
      message: result.simulated ? 
        'Notificación simulada (modo desarrollo)' : 
        'Notificación enviada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error debug médico:', error);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.code || 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST con {"doctorId": "ID_DEL_MEDICO"} para debuggear'
  });
}