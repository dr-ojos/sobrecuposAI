// Test simple de payment confirm con fix directo
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { paymentData } = await req.json();
    
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    console.log('🧪 === SIMPLE PAYMENT TEST ===');
    console.log('🧪 paymentData.sobrecupoId:', paymentData?.sobrecupoId);
    console.log('🧪 paymentData.doctorId:', paymentData?.doctorId);
    
    if (!paymentData?.sobrecupoId) {
      return NextResponse.json({
        success: false,
        error: 'No sobrecupoId provided',
        step: 'validation'
      });
    }
    
    // PASO 1: Obtener sobrecupo
    const sobrecupoResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Sobrecupos/${paymentData.sobrecupoId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    if (!sobrecupoResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Sobrecupo not found: ${sobrecupoResponse.status}`,
        step: 'sobrecupo_lookup',
        sobrecupoId: paymentData.sobrecupoId
      });
    }
    
    const sobrecupoData = await sobrecupoResponse.json();
    const realDoctorId = sobrecupoData.fields?.Médico?.[0];
    
    console.log('🧪 Sobrecupo encontrado, doctor ID extraído:', realDoctorId);
    
    if (!realDoctorId) {
      return NextResponse.json({
        success: false,
        error: 'No doctor ID found in sobrecupo',
        step: 'doctor_extraction',
        sobrecupoFields: sobrecupoData.fields
      });
    }
    
    // PASO 2: Obtener doctor
    const doctorResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Doctors/${realDoctorId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    if (!doctorResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Doctor not found: ${doctorResponse.status}`,
        step: 'doctor_lookup',
        realDoctorId
      });
    }
    
    const doctorData = await doctorResponse.json();
    const doctorEmail = doctorData.fields?.Email;
    const doctorWhatsApp = doctorData.fields?.WhatsApp;
    
    console.log('🧪 Doctor encontrado:', doctorData.fields?.Name);
    console.log('🧪 Email:', doctorEmail);
    console.log('🧪 WhatsApp:', doctorWhatsApp);
    
    // PASO 3: Test notificaciones
    let emailResult = { success: false, error: 'Not attempted' };
    let whatsappResult = { success: false, error: 'Not attempted' };
    
    if (doctorEmail && doctorWhatsApp) {
      // Usar debug endpoint para probar notificaciones
      try {
        const notificationTest = await fetch('https://sobrecupos-ai-esb7.vercel.app/api/debug-doctor-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorEmail: doctorEmail,
            doctorWhatsapp: doctorWhatsApp,
            doctorName: doctorData.fields?.Name || 'Doctor',
            patientName: paymentData.patientName || 'Test Patient',
            motivo: paymentData.motivo || 'Test'
          })
        });
        
        const notificationResult = await notificationTest.json();
        if (notificationResult.success) {
          emailResult = notificationResult.notificationResult.emailResult;
          whatsappResult = notificationResult.notificationResult.whatsappResult;
        }
      } catch (error: any) {
        console.log('❌ Error en test de notificaciones:', error.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      steps: {
        sobrecupo_lookup: 'SUCCESS',
        doctor_extraction: 'SUCCESS', 
        doctor_lookup: 'SUCCESS',
        notifications: doctorEmail && doctorWhatsApp ? 'ATTEMPTED' : 'SKIPPED'
      },
      data: {
        originalDoctorId: paymentData.doctorId,
        extractedDoctorId: realDoctorId,
        doctorName: doctorData.fields?.Name,
        doctorEmail: doctorEmail,
        doctorWhatsApp: doctorWhatsApp,
        emailResult,
        whatsappResult
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error in simple payment test:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}