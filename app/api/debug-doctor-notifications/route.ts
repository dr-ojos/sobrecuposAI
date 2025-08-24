// Debug route para probar notificaciones médicas en producción
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('🧪 === DEBUG DOCTOR NOTIFICATIONS ===');
    console.log('🧪 Request body:', JSON.stringify(body, null, 2));
    
    const {
      doctorId,
      doctorEmail,
      doctorWhatsapp,
      doctorName = 'Dr. Test',
      patientName = 'Paciente Test',
      patientRut = '12345678-9',
      patientPhone = '+56912345678',
      patientEmail = 'test@test.com',
      motivo = 'Test de notificaciones'
    } = body;

    // Variables de entorno críticas
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

    console.log('🔧 === ENVIRONMENT CHECK ===');
    console.log('🔧 AIRTABLE_API_KEY presente:', !!AIRTABLE_API_KEY);
    console.log('🔧 AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID);
    console.log('🔧 SENDGRID_API_KEY presente:', !!SENDGRID_API_KEY);
    console.log('🔧 SENDGRID_FROM_EMAIL:', SENDGRID_FROM_EMAIL);
    console.log('🔧 TWILIO_ACCOUNT_SID presente:', !!TWILIO_ACCOUNT_SID);
    console.log('🔧 TWILIO_AUTH_TOKEN presente:', !!TWILIO_AUTH_TOKEN);
    console.log('🔧 TWILIO_WHATSAPP_NUMBER:', TWILIO_WHATSAPP_NUMBER);

    let doctorData: any = null;

    // 1. OBTENER INFO DEL MÉDICO (si se proporciona doctorId)
    if (doctorId && AIRTABLE_API_KEY && AIRTABLE_BASE_ID) {
      const DOCTOR_TABLES = ['Doctors', 'Médicos', 'Medicos', 'Doctor'];
      
      for (const tableName of DOCTOR_TABLES) {
        try {
          console.log(`🔍 Buscando médico en tabla: ${tableName}`);
          const doctorResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}/${doctorId}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );
          
          const responseText = await doctorResponse.text();
          console.log(`📋 Respuesta ${tableName} (${doctorResponse.status}):`, responseText.substring(0, 200));
          
          if (doctorResponse.ok) {
            doctorData = JSON.parse(responseText);
            console.log(`✅ Médico encontrado en ${tableName}:`, JSON.stringify(doctorData?.fields, null, 2));
            break;
          }
        } catch (error: any) {
          console.log(`❌ Error en tabla ${tableName}:`, error.message);
        }
      }
    }

    // Usar datos del médico encontrado o datos de prueba
    const finalDoctorEmail = doctorData?.fields?.Email || doctorEmail;
    const finalDoctorWhatsapp = doctorData?.fields?.WhatsApp || doctorWhatsapp;
    const finalDoctorName = doctorData?.fields?.Name || doctorName;

    console.log('📧 Email final del médico:', finalDoctorEmail);
    console.log('📱 WhatsApp final del médico:', finalDoctorWhatsapp);

    // 2. PROBAR NOTIFICATION SERVICE
    if (!finalDoctorEmail && !finalDoctorWhatsapp) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró email ni WhatsApp del médico',
        doctorData: doctorData?.fields || null
      });
    }

    try {
      const { NotificationService } = require('../../../lib/notification-service.js');
      const notificationService = new NotificationService({
        maxRetries: 3,
        retryDelay: 2000
      });

      // Template simple de email para test
      const simpleEmailHtml = `
        <h2>🧪 TEST DE NOTIFICACIONES</h2>
        <p>Dr. ${finalDoctorName}, este es un test de notificaciones del sistema SobrecuposIA.</p>
        <p><strong>Paciente:</strong> ${patientName}</p>
        <p><strong>Motivo:</strong> ${motivo}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `;

      console.log('🚀 Iniciando NotificationService test...');
      const result = await notificationService.notifyDoctorWithFallback(
        {
          name: finalDoctorName,
          email: finalDoctorEmail,
          whatsapp: finalDoctorWhatsapp
        },
        {
          name: patientName,
          rut: patientRut,
          phone: patientPhone,
          email: patientEmail
        },
        {
          fecha: new Date().toLocaleDateString(),
          hora: new Date().toLocaleTimeString(),
          clinica: 'Clínica Test'
        },
        simpleEmailHtml,
        motivo
      );

      console.log('🎯 Resultado NotificationService:', JSON.stringify(result, null, 2));

      return NextResponse.json({
        success: true,
        doctorFound: !!doctorData,
        doctorData: doctorData?.fields || null,
        finalDoctorEmail,
        finalDoctorWhatsapp,
        notificationResult: result,
        environmentCheck: {
          airtable: !!AIRTABLE_API_KEY,
          sendgrid: !!SENDGRID_API_KEY,
          twilio: !!TWILIO_ACCOUNT_SID
        }
      });

    } catch (error: any) {
      console.error('❌ Error en NotificationService test:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        stack: error.stack
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Error general en debug:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug endpoint para probar notificaciones médicas',
    usage: 'POST con { "doctorId": "recXXX" } o { "doctorEmail": "test@test.com", "doctorWhatsapp": "+56912345678" }'
  });
}