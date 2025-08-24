// Nuevo sistema de notificaciones médicas - Simple y confiable
import { NextResponse } from 'next/server';

// Template email para médico
function generateDoctorEmailHtml(data: {
  doctorName: string;
  patientName: string;
  patientRut: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: number;
  fecha: string;
  hora: string;
  especialidad: string;
  clinica: string;
  motivo?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Reserva de Sobrecupo</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #dc2626; margin: 0 0 10px 0;">🏥 Nueva Reserva de Sobrecupo</h1>
        <p style="margin: 0; font-size: 18px; font-weight: bold;">Dr/a. ${data.doctorName}</p>
    </div>
    
    <div style="background: white; padding: 20px; border: 2px solid #dc2626; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin-top: 0;">📅 Detalles de la Cita</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Fecha:</td>
                <td style="padding: 8px 0;">${data.fecha}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Hora:</td>
                <td style="padding: 8px 0;">${data.hora}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Especialidad:</td>
                <td style="padding: 8px 0;">${data.especialidad}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Clínica:</td>
                <td style="padding: 8px 0;">${data.clinica}</td>
            </tr>
        </table>
    </div>
    
    <div style="background: white; padding: 20px; border: 2px solid #059669; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #059669; margin-top: 0;">👤 Datos del Paciente</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Nombre:</td>
                <td style="padding: 8px 0;">${data.patientName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">RUT:</td>
                <td style="padding: 8px 0;">${data.patientRut}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Teléfono:</td>
                <td style="padding: 8px 0;">${data.patientPhone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;">${data.patientEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Edad:</td>
                <td style="padding: 8px 0;">${data.patientAge} años</td>
            </tr>
            ${data.motivo ? `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 0; font-weight: bold;">Motivo:</td>
                <td style="padding: 8px 0;">${data.motivo}</td>
            </tr>
            ` : ''}
        </table>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; font-weight: bold; color: #92400e;">✅ El paciente ha confirmado su asistencia y pagado la consulta.</p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
        <p style="margin: 0; color: #666; font-size: 14px;">
            Este es un mensaje automático del sistema Sobrecupos<br>
            <strong>contacto@sobrecupos.com</strong>
        </p>
    </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const { 
      doctorEmail, 
      doctorWhatsapp, 
      doctorName,
      patientName,
      patientRut,
      patientPhone,
      patientEmail,
      patientAge,
      fecha,
      hora,
      especialidad,
      clinica,
      motivo 
    } = await req.json();

    console.log('📧 === NUEVO SISTEMA NOTIFICACIÓN MÉDICO ===');
    console.log('📧 Doctor Email:', doctorEmail);
    console.log('📧 Doctor WhatsApp:', doctorWhatsapp);
    console.log('📧 Paciente:', patientName);

    const results = {
      emailSent: false,
      whatsappSent: false,
      emailError: null,
      whatsappError: null
    };

    // PASO 1: ENVIAR EMAIL AL MÉDICO
    if (doctorEmail) {
      console.log('📧 Enviando email al médico...');
      
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
      const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

      if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
        console.error('❌ Faltan credenciales de SendGrid');
        results.emailError = 'Credenciales de email no configuradas';
      } else {
        try {
          const emailHtml = generateDoctorEmailHtml({
            doctorName: doctorName || 'Doctor',
            patientName,
            patientRut: patientRut || 'No proporcionado',
            patientPhone: patientPhone || 'No proporcionado',
            patientEmail: patientEmail || 'No proporcionado',
            patientAge: patientAge || 0,
            fecha: fecha || 'No especificada',
            hora: hora || 'No especificada',
            especialidad: especialidad || 'No especificada',
            clinica: clinica || 'No especificada',
            motivo: motivo || null
          });

          const emailPayload = {
            personalizations: [{
              to: [{ email: doctorEmail }],
              subject: `🏥 Nueva Reserva - ${patientName} - ${fecha} ${hora}`
            }],
            from: { 
              email: SENDGRID_FROM_EMAIL, 
              name: "Sistema Sobrecupos" 
            },
            content: [{
              type: "text/html",
              value: emailHtml
            }],
            categories: ["doctor-notification"],
            custom_args: {
              "notification_type": "doctor_new_appointment",
              "doctor_email": doctorEmail,
              "patient_name": patientName
            }
          };

          console.log('📧 Enviando email a SendGrid...');
          
          const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload)
          });

          if (emailResponse.ok) {
            console.log('✅ Email enviado correctamente al médico');
            results.emailSent = true;
          } else {
            const errorText = await emailResponse.text();
            console.error('❌ Error enviando email:', errorText);
            results.emailError = `SendGrid error ${emailResponse.status}: ${errorText}`;
          }

        } catch (error: any) {
          console.error('❌ Excepción enviando email:', error);
          results.emailError = error.message;
        }
      }
    } else {
      results.emailError = 'No email del médico proporcionado';
    }

    // PASO 2: ENVIAR WHATSAPP AL MÉDICO
    if (doctorWhatsapp) {
      console.log('📱 Enviando WhatsApp al médico...');
      
      const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
      const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
      const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
        console.error('❌ Faltan credenciales de Twilio');
        results.whatsappError = 'Credenciales de WhatsApp no configuradas';
      } else {
        try {
          const whatsappMessage = `🏥 *Nueva Reserva de Sobrecupo*

Dr/a. ${doctorName || 'Doctor'}

📅 *Detalles de la Cita:*
• Fecha: ${fecha}
• Hora: ${hora}
• Especialidad: ${especialidad}
• Clínica: ${clinica}

👤 *Datos del Paciente:*
• Nombre: ${patientName}
• RUT: ${patientRut}
• Teléfono: ${patientPhone}
• Email: ${patientEmail}
• Edad: ${patientAge} años
${motivo ? `• Motivo: ${motivo}` : ''}

✅ El paciente ha confirmado su asistencia y pagado la consulta.

_Sistema Sobrecupos_`;

          // Preparar número de WhatsApp del doctor
          let doctorWhatsAppFormatted = doctorWhatsapp.replace(/\D/g, '');
          if (!doctorWhatsAppFormatted.startsWith('56')) {
            doctorWhatsAppFormatted = '56' + doctorWhatsAppFormatted;
          }
          const toNumber = `whatsapp:+${doctorWhatsAppFormatted}`;
          const fromNumber = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

          console.log('📱 Enviando desde:', fromNumber);
          console.log('📱 Enviando hacia:', toNumber);

          const whatsappPayload = {
            From: fromNumber,
            To: toNumber,
            Body: whatsappMessage
          };

          // Autenticación básica para Twilio
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
            console.log('✅ WhatsApp enviado correctamente al médico:', whatsappResult.sid);
            results.whatsappSent = true;
          } else {
            const errorText = await whatsappResponse.text();
            console.error('❌ Error enviando WhatsApp:', errorText);
            results.whatsappError = `Twilio error ${whatsappResponse.status}: ${errorText}`;
          }

        } catch (error: any) {
          console.error('❌ Excepción enviando WhatsApp:', error);
          results.whatsappError = error.message;
        }
      }
    } else {
      results.whatsappError = 'No WhatsApp del médico proporcionado';
    }

    // RESULTADO FINAL
    const success = results.emailSent || results.whatsappSent;
    console.log('📊 === RESULTADO NOTIFICACIONES ===');
    console.log('📧 Email enviado:', results.emailSent);
    console.log('📱 WhatsApp enviado:', results.whatsappSent);
    console.log('✅ Al menos una notificación exitosa:', success);

    return NextResponse.json({
      success,
      results,
      message: success ? 
        'Notificaciones enviadas correctamente' : 
        'Error enviando todas las notificaciones'
    });

  } catch (error: any) {
    console.error('❌ Error general en notificación médica:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}