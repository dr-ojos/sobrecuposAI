// Diagnóstico específico para el problema de notificaciones médicas
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { sobrecupoId } = await req.json();
    
    console.log('🔍 === DIAGNÓSTICO COMPLETO MÉDICO ===');
    console.log('🔍 SobrecupoId recibido:', sobrecupoId);

    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

    const diagnosis: any = {
      step1_sobrecupo: null,
      step2_doctor_extraction: null,
      step3_doctor_lookup: null,
      step4_doctor_data: null,
      step5_sendgrid_test: null,
      step6_twilio_test: null,
      environment: {
        hasAirtableKey: !!AIRTABLE_API_KEY,
        hasAirtableBase: !!AIRTABLE_BASE_ID,
        hasSendGridKey: !!SENDGRID_API_KEY,
        hasSendGridFrom: !!SENDGRID_FROM_EMAIL,
        hasTwilioSid: !!TWILIO_ACCOUNT_SID,
        hasTwilioToken: !!TWILIO_AUTH_TOKEN,
        hasTwilioWhatsApp: !!TWILIO_WHATSAPP_NUMBER,
        sendGridFrom: SENDGRID_FROM_EMAIL,
        twilioWhatsApp: TWILIO_WHATSAPP_NUMBER
      }
    };

    // PASO 1: Obtener sobrecupo
    console.log('🔍 PASO 1: Obteniendo sobrecupo...');
    try {
      const sobrecupoResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Sobrecupos/${sobrecupoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (sobrecupoResponse.ok) {
        const sobrecupoData = await sobrecupoResponse.json();
        diagnosis.step1_sobrecupo = {
          success: true,
          data: sobrecupoData.fields,
          doctorField: sobrecupoData.fields?.Médico
        };
        console.log('✅ Sobrecupo encontrado:', sobrecupoData.fields);

        // PASO 2: Extraer doctorId
        const doctorId = sobrecupoData.fields?.Médico?.[0];
        console.log('🔍 PASO 2: Doctor ID extraído:', doctorId);
        
        if (doctorId) {
          diagnosis.step2_doctor_extraction = {
            success: true,
            doctorId: doctorId
          };

          // PASO 3: Buscar doctor en diferentes tablas
          console.log('🔍 PASO 3: Buscando médico en tablas...');
          const DOCTOR_TABLES = ['Doctors', 'Médicos', 'Medicos', 'Doctor'];
          let doctorData: any = null;
          let foundInTable: string | null = null;

          for (const tableName of DOCTOR_TABLES) {
            try {
              console.log(`🔍 Probando tabla: ${tableName}`);
              const doctorResponse = await fetch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}/${doctorId}`,
                { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
              );

              if (doctorResponse.ok) {
                doctorData = await doctorResponse.json();
                foundInTable = tableName;
                console.log(`✅ Médico encontrado en tabla: ${tableName}`);
                break;
              } else {
                console.log(`❌ No encontrado en tabla ${tableName}: ${doctorResponse.status}`);
              }
            } catch (error: any) {
              console.log(`❌ Error en tabla ${tableName}:`, error.message);
            }
          }

          if (doctorData && foundInTable) {
            diagnosis.step3_doctor_lookup = {
              success: true,
              foundInTable: foundInTable,
              doctorId: doctorId
            };

            // PASO 4: Analizar datos del médico
            console.log('🔍 PASO 4: Analizando datos del médico...');
            const doctorEmail = doctorData.fields?.Email;
            const doctorWhatsApp = doctorData.fields?.WhatsApp;
            const doctorName = doctorData.fields?.Name || doctorData.fields?.Nombre;

            diagnosis.step4_doctor_data = {
              success: true,
              allFields: Object.keys(doctorData.fields),
              email: doctorEmail,
              whatsapp: doctorWhatsApp,
              name: doctorName,
              hasEmail: !!doctorEmail,
              hasWhatsApp: !!doctorWhatsApp,
              fullData: doctorData.fields
            };

            console.log('📧 Email del médico:', doctorEmail);
            console.log('📱 WhatsApp del médico:', doctorWhatsApp);
            console.log('👨‍⚕️ Nombre del médico:', doctorName);

            // PASO 5: Test SendGrid si hay email
            if (doctorEmail && SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
              console.log('🔍 PASO 5: Probando SendGrid...');
              try {
                const testEmailPayload = {
                  personalizations: [{
                    to: [{ email: doctorEmail }],
                    subject: '🧪 TEST - Sistema Sobrecupos'
                  }],
                  from: { 
                    email: SENDGRID_FROM_EMAIL, 
                    name: "Sistema Sobrecupos TEST" 
                  },
                  content: [{
                    type: "text/html",
                    value: `
                    <h1>🧪 TEST del Sistema</h1>
                    <p>Dr/a. ${doctorName}, este es un test del sistema de notificaciones.</p>
                    <p>Si recibe este email, SendGrid está funcionando correctamente.</p>
                    <p><strong>Fecha del test:</strong> ${new Date().toLocaleString()}</p>
                    `
                  }]
                };

                const emailTestResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
                  method: "POST",
                  headers: {
                    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(testEmailPayload)
                });

                diagnosis.step5_sendgrid_test = {
                  success: emailTestResponse.ok,
                  status: emailTestResponse.status,
                  error: emailTestResponse.ok ? null : await emailTestResponse.text()
                };

                if (emailTestResponse.ok) {
                  console.log('✅ SendGrid test exitoso');
                } else {
                  console.log('❌ SendGrid test falló:', diagnosis.step5_sendgrid_test.error);
                }

              } catch (error: any) {
                diagnosis.step5_sendgrid_test = {
                  success: false,
                  error: error.message
                };
                console.log('❌ Excepción en test SendGrid:', error.message);
              }
            } else {
              diagnosis.step5_sendgrid_test = {
                success: false,
                error: 'Sin email del médico o credenciales SendGrid'
              };
            }

            // PASO 6: Test Twilio si hay WhatsApp
            if (doctorWhatsApp && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
              console.log('🔍 PASO 6: Probando Twilio WhatsApp...');
              try {
                let doctorWhatsAppFormatted = doctorWhatsApp.replace(/\D/g, '');
                if (!doctorWhatsAppFormatted.startsWith('56')) {
                  doctorWhatsAppFormatted = '56' + doctorWhatsAppFormatted;
                }
                const toNumber = `whatsapp:+${doctorWhatsAppFormatted}`;
                const fromNumber = `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

                console.log('📱 Test WhatsApp desde:', fromNumber, 'hacia:', toNumber);

                const testWhatsAppMessage = `🧪 *TEST - Sistema Sobrecupos*

Dr/a. ${doctorName}

Este es un test del sistema de notificaciones.

Si recibe este WhatsApp, Twilio está funcionando correctamente.

Fecha del test: ${new Date().toLocaleString()}

_Sistema Sobrecupos TEST_`;

                const whatsappPayload = {
                  From: fromNumber,
                  To: toNumber,
                  Body: testWhatsAppMessage
                };

                const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

                const whatsappTestResponse = await fetch(
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

                if (whatsappTestResponse.ok) {
                  const whatsappResult = await whatsappTestResponse.json();
                  diagnosis.step6_twilio_test = {
                    success: true,
                    messageSid: whatsappResult.sid,
                    toNumber,
                    fromNumber
                  };
                  console.log('✅ Twilio WhatsApp test exitoso:', whatsappResult.sid);
                } else {
                  const errorText = await whatsappTestResponse.text();
                  diagnosis.step6_twilio_test = {
                    success: false,
                    status: whatsappTestResponse.status,
                    error: errorText
                  };
                  console.log('❌ Twilio WhatsApp test falló:', errorText);
                }

              } catch (error: any) {
                diagnosis.step6_twilio_test = {
                  success: false,
                  error: error.message
                };
                console.log('❌ Excepción en test Twilio:', error.message);
              }
            } else {
              diagnosis.step6_twilio_test = {
                success: false,
                error: 'Sin WhatsApp del médico o credenciales Twilio'
              };
            }

          } else {
            diagnosis.step3_doctor_lookup = {
              success: false,
              error: 'Médico no encontrado en ninguna tabla'
            };
          }

        } else {
          diagnosis.step2_doctor_extraction = {
            success: false,
            error: 'No se pudo extraer doctorId del sobrecupo'
          };
        }

      } else {
        const errorText = await sobrecupoResponse.text();
        diagnosis.step1_sobrecupo = {
          success: false,
          error: `Error ${sobrecupoResponse.status}: ${errorText}`
        };
      }

    } catch (error: any) {
      diagnosis.step1_sobrecupo = {
        success: false,
        error: error.message
      };
    }

    console.log('🔍 === DIAGNÓSTICO COMPLETO ===');
    console.log(JSON.stringify(diagnosis, null, 2));

    return NextResponse.json({
      success: true,
      diagnosis,
      summary: {
        sobrecupo: diagnosis.step1_sobrecupo?.success ? '✅' : '❌',
        doctorExtraction: diagnosis.step2_doctor_extraction?.success ? '✅' : '❌',
        doctorLookup: diagnosis.step3_doctor_lookup?.success ? '✅' : '❌',
        doctorData: diagnosis.step4_doctor_data?.success ? '✅' : '❌',
        sendGridTest: diagnosis.step5_sendgrid_test?.success ? '✅' : '❌',
        twilioTest: diagnosis.step6_twilio_test?.success ? '✅' : '❌'
      }
    });

  } catch (error: any) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}