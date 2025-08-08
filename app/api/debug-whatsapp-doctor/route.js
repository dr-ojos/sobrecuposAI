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
    const doctorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/doctors/${doctorId}`);
    
    if (!doctorResponse.ok) {
      console.error('❌ Error obteniendo médico:', doctorResponse.status);
      return NextResponse.json({ 
        error: 'Médico no encontrado' 
      }, { status: 404 });
    }

    const doctorData = await doctorResponse.json();
    console.log('🩺 Doctor data completa:', JSON.stringify(doctorData, null, 2));
    
    // Obtener campos desde la estructura de Airtable
    const doctorFields = doctorData.fields || {};
    const whatsappNumber = doctorFields.WhatsApp || doctorFields.whatsapp;
    const doctorName = doctorFields.Name || doctorFields.name;
    const especialidad = doctorFields.Especialidad || doctorFields.especialidad;
    
    console.log('🩺 Doctor WhatsApp:', whatsappNumber);
    console.log('🩺 Doctor Name:', doctorName);
    console.log('🩺 Doctor Especialidad:', especialidad);

    if (!whatsappNumber) {
      console.log('❌ Médico NO tiene WhatsApp configurado');
      return NextResponse.json({
        success: false,
        error: 'Médico sin WhatsApp configurado',
        doctorData: {
          id: doctorData.id,
          name: doctorName,
          especialidad: especialidad,
          whatsapp: whatsappNumber,
          allFields: doctorFields
        }
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

    // Preparar datos del médico en el formato esperado por el servicio WhatsApp
    const doctorForWhatsApp = {
      name: doctorName,
      whatsapp: whatsappNumber,
      especialidad: especialidad
    };

    const result = await whatsAppService.notifyDoctorNewPatient(
      doctorForWhatsApp, 
      testPatientData, 
      testAppointmentData, 
      testMotivo
    );

    console.log('🩺 ✅ Resultado notificación:', result);

    return NextResponse.json({
      success: true,
      result: result,
      doctorData: {
        name: doctorName,
        whatsapp: whatsappNumber,
        especialidad: especialidad
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