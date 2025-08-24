// Test específico para verificar extracción de datos del médico
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const sobrecupoId = "recFj7aKdC9zBDwxu";
    
    console.log('🔍 === TEST EXTRACCIÓN MÉDICO ===');
    
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    // PASO 1: Obtener sobrecupo
    console.log('🔍 Obteniendo sobrecupo:', sobrecupoId);
    const sobrecupoResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Sobrecupos/${sobrecupoId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    if (!sobrecupoResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Sobrecupo not found: ${sobrecupoResponse.status}`,
        step: 'sobrecupo_lookup'
      });
    }
    
    const sobrecupoData = await sobrecupoResponse.json();
    console.log('✅ Sobrecupo fields:', Object.keys(sobrecupoData.fields));
    console.log('✅ Campo Médico:', sobrecupoData.fields?.Médico);
    
    const realDoctorId = sobrecupoData.fields?.Médico?.[0];
    console.log('✅ Doctor ID extraído:', realDoctorId);
    
    if (!realDoctorId) {
      return NextResponse.json({
        success: false,
        error: 'No doctor ID found in sobrecupo',
        sobrecupoFields: sobrecupoData.fields
      });
    }
    
    // PASO 2: Obtener doctor
    console.log('🔍 Buscando médico con ID:', realDoctorId);
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
    const doctorName = doctorData.fields?.Name;
    
    console.log('✅ Datos del médico extraídos:');
    console.log('  - Name:', doctorName);
    console.log('  - Email:', doctorEmail);
    console.log('  - WhatsApp:', doctorWhatsApp);
    console.log('  - Todos los campos:', Object.keys(doctorData.fields));
    console.log('  - Datos completos:', doctorData.fields);
    
    // TEST DIRECTO DE EMAIL AL MÉDICO
    let emailTestResult = null;
    if (doctorEmail) {
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
      const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
      
      if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
        try {
          console.log('📧 ENVIANDO TEST EMAIL DIRECTO AL MÉDICO...');
          
          const emailPayload = {
            personalizations: [{
              to: [{ email: doctorEmail }],
              subject: '🧪 TEST DIRECTO - Sistema Sobrecupos'
            }],
            from: { 
              email: SENDGRID_FROM_EMAIL, 
              name: "Sistema Sobrecupos TEST" 
            },
            content: [{
              type: "text/html",
              value: `
              <h1>🧪 TEST DIRECTO DEL SISTEMA</h1>
              <p>Dr/a. ${doctorName}</p>
              <p>Este es un test directo para verificar que el email llega correctamente.</p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Doctor ID:</strong> ${realDoctorId}</p>
              <p><strong>Email destino:</strong> ${doctorEmail}</p>
              <hr>
              <p>Si recibe este email, la integración SendGrid está funcionando correctamente.</p>
              `
            }]
          };

          const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload)
          });

          emailTestResult = {
            success: emailResponse.ok,
            status: emailResponse.status,
            error: emailResponse.ok ? null : await emailResponse.text()
          };

          if (emailResponse.ok) {
            console.log('✅ EMAIL TEST AL MÉDICO ENVIADO CORRECTAMENTE');
          } else {
            console.log('❌ EMAIL TEST AL MÉDICO FALLÓ:', emailTestResult.error);
          }

        } catch (error: any) {
          console.log('❌ Excepción en email test:', error.message);
          emailTestResult = {
            success: false,
            error: error.message
          };
        }
      } else {
        emailTestResult = {
          success: false,
          error: 'Credenciales SendGrid no configuradas'
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        sobrecupoFields: Object.keys(sobrecupoData.fields),
        medicoCampo: sobrecupoData.fields?.Médico,
        extractedDoctorId: realDoctorId,
        doctorFields: Object.keys(doctorData.fields),
        doctorName: doctorName,
        doctorEmail: doctorEmail,
        doctorWhatsApp: doctorWhatsApp,
        fullDoctorData: doctorData.fields,
        emailTestResult
      },
      debug: {
        step1: 'Sobrecupo obtenido correctamente',
        step2: 'Doctor ID extraído correctamente',
        step3: 'Doctor encontrado en tabla Doctors',
        step4: doctorEmail ? 'Email del médico encontrado' : 'Email del médico NO encontrado',
        step5: doctorWhatsApp ? 'WhatsApp del médico encontrado' : 'WhatsApp del médico NO encontrado'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error en test extracción médico:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}