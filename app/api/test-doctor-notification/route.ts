// Test directo de notificaciones médicas
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('🧪 === TEST DIRECTO NOTIFICACIÓN MÉDICA ===');

    const results = {
      emailSent: false,
      whatsappSent: false,
      emailError: null,
      whatsappError: null
    };

    // Datos de test
    const testData = {
      doctorEmail: 'joseandres@outlook.com',
      doctorName: 'Dr. Test Martinez',
      patientName: 'Jose Andres Pena TEST',
      patientRut: '12.345.678-9',
      patientPhone: '+56987654321',
      patientEmail: 'paciente@test.com',
      patientAge: 35,
      fecha: '2025-08-25',
      hora: '10:00 AM',
      especialidad: 'Medicina General',
      clinica: 'Clinica Test',
      motivo: 'TEST DIRECTO DEL SISTEMA DE NOTIFICACIONES'
    };

    // TEST EMAIL
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    console.log('📧 Credenciales SendGrid:', {
      hasApiKey: !!SENDGRID_API_KEY,
      fromEmail: SENDGRID_FROM_EMAIL
    });

    if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
      try {
        const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">🏥 TEST - Nueva Reserva de Sobrecupo</h1>
          <h2>Dr/a. ${testData.doctorName}</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>📅 Detalles de la Cita:</h3>
            <p><strong>Fecha:</strong> ${testData.fecha}</p>
            <p><strong>Hora:</strong> ${testData.hora}</p>
            <p><strong>Especialidad:</strong> ${testData.especialidad}</p>
            <p><strong>Clínica:</strong> ${testData.clinica}</p>
          </div>
          
          <div style="background: #e6f7ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3>👤 Datos del Paciente:</h3>
            <p><strong>Nombre:</strong> ${testData.patientName}</p>
            <p><strong>RUT:</strong> ${testData.patientRut}</p>
            <p><strong>Teléfono:</strong> ${testData.patientPhone}</p>
            <p><strong>Email:</strong> ${testData.patientEmail}</p>
            <p><strong>Edad:</strong> ${testData.patientAge} años</p>
            <p><strong>Motivo:</strong> ${testData.motivo}</p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 10px;">
            <p style="margin: 0; font-weight: bold;">✅ El paciente ha confirmado su asistencia y pagado la consulta.</p>
          </div>
          
          <p style="color: #666; text-align: center; margin-top: 20px;">
            Sistema Sobrecupos - contacto@sobrecupos.com
          </p>
        </div>`;

        const emailPayload = {
          personalizations: [{
            to: [{ email: testData.doctorEmail }],
            subject: `🧪 TEST - Nueva Reserva - ${testData.patientName} - ${testData.fecha} ${testData.hora}`
          }],
          from: { 
            email: SENDGRID_FROM_EMAIL, 
            name: "Sistema Sobrecupos TEST" 
          },
          content: [{
            type: "text/html",
            value: emailHtml
          }],
          categories: ["doctor-notification-test"]
        };

        console.log('📧 Enviando email test a SendGrid...');

        const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload)
        });

        if (emailResponse.ok) {
          console.log('✅ Email test enviado correctamente');
          results.emailSent = true;
        } else {
          const errorText = await emailResponse.text();
          console.error('❌ Error enviando email test:', errorText);
          results.emailError = `SendGrid error ${emailResponse.status}: ${errorText}`;
        }

      } catch (error: any) {
        console.error('❌ Excepción enviando email test:', error);
        results.emailError = error.message;
      }
    } else {
      results.emailError = 'Credenciales SendGrid no configuradas';
    }

    // TEST WHATSAPP
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

    console.log('📱 Credenciales Twilio:', {
      hasAccountSid: !!TWILIO_ACCOUNT_SID,
      hasAuthToken: !!TWILIO_AUTH_TOKEN,
      whatsappNumber: TWILIO_WHATSAPP_NUMBER
    });

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
      try {
        const whatsappMessage = `🧪 *TEST - Nueva Reserva de Sobrecupo*

Dr/a. ${testData.doctorName}

📅 *Detalles de la Cita:*
• Fecha: ${testData.fecha}
• Hora: ${testData.hora}
• Especialidad: ${testData.especialidad}
• Clínica: ${testData.clinica}

👤 *Datos del Paciente:*
• Nombre: ${testData.patientName}
• RUT: ${testData.patientRut}
• Teléfono: ${testData.patientPhone}
• Email: ${testData.patientEmail}
• Edad: ${testData.patientAge} años
• Motivo: ${testData.motivo}

✅ El paciente ha confirmado su asistencia y pagado la consulta.

_Sistema Sobrecupos TEST_`;

        // Usar número de test para WhatsApp
        const testWhatsApp = '+56912345678';
        const toNumber = `whatsapp:${testWhatsApp}`;
        const fromNumber = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

        console.log('📱 Test WhatsApp desde:', fromNumber, 'hacia:', toNumber);

        const whatsappPayload = {
          From: fromNumber,
          To: toNumber,
          Body: whatsappMessage
        };

        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

        const whatsappResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(whatsappPayload).toString()
          }
        );

        if (whatsappResponse.ok) {
          const whatsappResult = await whatsappResponse.json();
          console.log('✅ WhatsApp test enviado correctamente:', whatsappResult.sid);
          results.whatsappSent = true;
        } else {
          const errorText = await whatsappResponse.text();
          console.error('❌ Error enviando WhatsApp test:', errorText);
          results.whatsappError = `Twilio error ${whatsappResponse.status}: ${errorText}`;
        }

      } catch (error: any) {
        console.error('❌ Excepción enviando WhatsApp test:', error);
        results.whatsappError = error.message;
      }
    } else {
      results.whatsappError = 'Credenciales Twilio no configuradas';
    }

    console.log('🧪 === RESULTADO TEST ===');
    console.log('📧 Email enviado:', results.emailSent);
    console.log('📱 WhatsApp enviado:', results.whatsappSent);
    console.log('❌ Email error:', results.emailError);
    console.log('❌ WhatsApp error:', results.whatsappError);

    const success = results.emailSent || results.whatsappSent;

    return NextResponse.json({
      success,
      results,
      message: success ? 
        'Test de notificaciones completado - al menos una exitosa' : 
        'Test de notificaciones falló - verificar credenciales'
    });

  } catch (error: any) {
    console.error('❌ Error general en test:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}