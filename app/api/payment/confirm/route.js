// app/api/payment/confirm/route.js
import { NextResponse } from 'next/server';
import whatsAppService from '../../../../lib/whatsapp-service.js';

// Función para obtener información del médico (duplicada del bot)
async function getDoctorInfo(doctorId) {
  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_DOCTORS_TABLE = process.env.AIRTABLE_DOCTORS_TABLE;
    
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${doctorId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      return { name: doctorId, email: null, whatsapp: null };
    }
    
    const data = await response.json();
    return {
      name: data.fields?.Name || data.fields?.Nombre || 'Doctor',
      email: data.fields?.Email || data.fields?.Correo || null,
      whatsapp: data.fields?.WhatsApp || data.fields?.Telefono || null,
    };
    
  } catch (error) {
    console.error('❌ Error getDoctorInfo:', error);
    return { name: 'Doctor', email: null, whatsapp: null };
  }
}

// Función para formatear fecha en español
function formatSpanishDate(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('es-ES', options);
}

export async function POST(req) {
  try {
    console.log('🟡 === PARSEANDO REQUEST ===');
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error('❌ Error parseando JSON del request:', parseError);
      throw new Error(`Error parseando JSON: ${parseError.message}`);
    }
    
    const { 
      sessionId, 
      transactionId, 
      sobrecupoId, 
      patientData, 
      appointmentData 
    } = requestData;

    console.log('🔄 === INICIO CONFIRMACIÓN DE PAGO ===');
    console.log('📋 Datos recibidos:', {
      sessionId,
      transactionId,
      sobrecupoId,
      patientData,
      appointmentData
    });

    // Validar que sobrecupoId esté presente y tenga formato correcto
    if (!sobrecupoId) {
      console.error('❌ sobrecupoId es requerido');
      throw new Error('sobrecupoId es requerido');
    }

    if (typeof sobrecupoId !== 'string' || sobrecupoId.length < 10) {
      console.error('❌ sobrecupoId tiene formato inválido:', sobrecupoId);
      throw new Error('sobrecupoId tiene formato inválido');
    }

    // Variables de entorno necesarias
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    console.log('🔧 Variables de entorno:', {
      AIRTABLE_API_KEY: AIRTABLE_API_KEY ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_BASE_ID: AIRTABLE_BASE_ID ? '✅ Presente' : '❌ Faltante',
      AIRTABLE_TABLE_ID: AIRTABLE_TABLE_ID ? '✅ Presente' : '❌ Faltante',
      SENDGRID_API_KEY: SENDGRID_API_KEY ? '✅ Presente' : '❌ Faltante',
      SENDGRID_FROM_EMAIL: SENDGRID_FROM_EMAIL ? '✅ Presente' : '❌ Faltante'
    });

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
      console.error('❌ VARIABLES DE AIRTABLE NO CONFIGURADAS');
      throw new Error('Variables de Airtable no configuradas');
    }

    let statusText = "";
    let sobrecupoUpdated = false;
    let pacienteCreated = false;
    let emailSent = false;

    try {
      // 1. CREAR PACIENTE EN TABLA PACIENTES (SI EXISTE)
      let pacienteId = null;
      if (process.env.AIRTABLE_PATIENTS_TABLE) {
        try {
          console.log("👤 Creando paciente en tabla Pacientes...");
          
          const pacienteDataForCreation = {
            fields: {
              Nombre: patientData.name,
              RUT: patientData.rut,
              Telefono: patientData.phone,
              Email: patientData.email,
              Edad: patientData.age,
              "Fecha Registro": new Date().toISOString().split('T')[0],
              "ID Transacción": transactionId
            }
          };
          
          const pacienteResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${process.env.AIRTABLE_PATIENTS_TABLE}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(pacienteDataForCreation),
            }
          );

          if (pacienteResponse.ok) {
            const pacienteResult = await pacienteResponse.json();
            pacienteId = pacienteResult.id;
            pacienteCreated = true;
            console.log("✅ Paciente creado exitosamente:", pacienteId);
          } else {
            console.error("⚠️ Error creando paciente (no crítico)");
          }

        } catch (pacienteErr) {
          console.error("⚠️ Error de conexión creando paciente:", pacienteErr);
        }
      }

      // 2. ACTUALIZAR SOBRECUPO (CRÍTICO)
      console.log("📅 === ACTUALIZANDO SOBRECUPO ===");
      console.log("🆔 Sobrecupo ID:", sobrecupoId);
      
      const updateData = {
        fields: {
          Disponible: "No",
          RUT: String(patientData.rut || ''),
          Edad: parseInt(patientData.age) || 0,
          Nombre: String(patientData.name || ''),
          Telefono: String(patientData.phone || ''),
          Email: String(patientData.email || ''),
          "Pagado": "Sí",
          "ID Transacción": String(transactionId || ''),
          "Fecha Pago": new Date().toISOString()
        }
      };

      console.log("📝 Datos a actualizar:", updateData);
      console.log("🔗 URL de actualización:", `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`);

      const updateResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      console.log("📡 Response status:", updateResponse.status);
      console.log("📡 Response ok:", updateResponse.ok);

      if (updateResponse.ok) {
        sobrecupoUpdated = true;
        console.log("✅ Sobrecupo actualizado exitosamente");
      } else {
        const errorData = await updateResponse.json();
        console.error("❌ Error actualizando sobrecupo:", errorData);
        console.error("❌ Response completa:", {
          status: updateResponse.status,
          statusText: updateResponse.statusText,
          errorData
        });
        throw new Error(`Error actualizando sobrecupo: ${updateResponse.status} - ${JSON.stringify(errorData)}`);
      }

      // 3. OBTENER DATOS DEL SOBRECUPO PARA NOTIFICACIONES
      const sobrecupoResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${sobrecupoId}`,
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      );

      if (!sobrecupoResponse.ok) {
        throw new Error('Error obteniendo datos del sobrecupo actualizado');
      }

      const sobrecupoData = await sobrecupoResponse.json();
      const sobrecupoFields = sobrecupoData.fields;

      // 4. NOTIFICAR AL MÉDICO VIA WHATSAPP Y EMAIL
      if (sobrecupoUpdated) {
        try {
          console.log("📱 Enviando notificaciones al médico...");
          
          const medicoId = Array.isArray(sobrecupoFields["Médico"]) ? 
            sobrecupoFields["Médico"][0] : sobrecupoFields["Médico"];
          
          const doctorInfo = await getDoctorInfo(medicoId);
          
          if (doctorInfo.whatsapp) {
            const fechaFormateada = formatSpanishDate(sobrecupoFields.Fecha);
            
            // WhatsApp al médico
            await whatsAppService.notifyDoctorNewPatient(
              {
                name: doctorInfo.name,
                whatsapp: doctorInfo.whatsapp
              },
              {
                name: patientData.name,
                rut: patientData.rut,
                phone: patientData.phone,
                email: patientData.email
              },
              {
                fecha: fechaFormateada,
                hora: sobrecupoFields.Hora,
                clinica: sobrecupoFields["Clínica"] || sobrecupoFields["Clinica"] || "Clínica",
                direccion: sobrecupoFields["Dirección"] || sobrecupoFields["Direccion"] || ""
              }
            );
            
            console.log("✅ WhatsApp enviado al médico exitosamente");
            
            // Email al médico
            if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && doctorInfo.email) {
              try {
                const doctorEmailContent = `¡Hola Dr/a. ${doctorInfo.name}!

¡Tienes un nuevo paciente registrado! 🎉

📅 DETALLES DE LA CITA:
• Fecha: ${fechaFormateada}
• Hora: ${sobrecupoFields.Hora}  
• Especialidad: ${appointmentData.specialty}
• Clínica: ${sobrecupoFields["Clínica"] || sobrecupoFields["Clinica"] || "Clínica"}

👤 DATOS DEL PACIENTE:
• Nombre: ${patientData.name}
• RUT: ${patientData.rut}
• Teléfono: ${patientData.phone}
• Email: ${patientData.email}
• Edad: ${patientData.age} años

💳 PAGO CONFIRMADO: $${parseInt(appointmentData.amount || '2990').toLocaleString('es-CL')} CLP
ID Transacción: ${transactionId}

✅ El paciente ha confirmado su asistencia.

Saludos,
Sistema Sobrecupos AI`;

                const doctorEmailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${SENDGRID_API_KEY}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    personalizations: [{
                      to: [{ email: doctorInfo.email, name: doctorInfo.name }],
                      subject: `👨‍⚕️ Nuevo paciente PAGADO: ${patientData.name} - ${fechaFormateada}`
                    }],
                    from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                    content: [{ type: "text/plain", value: doctorEmailContent }]
                  })
                });

                if (doctorEmailResponse.ok) {
                  console.log("✅ Email enviado al médico exitosamente");
                }
              } catch (doctorEmailErr) {
                console.error("⚠️ Error enviando email al médico:", doctorEmailErr);
              }
            }
          }
        } catch (whatsappErr) {
          console.error("⚠️ Error enviando notificaciones al médico:", whatsappErr);
        }
      }

      // 5. ENVIAR EMAIL DE CONFIRMACIÓN AL PACIENTE
      if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && sobrecupoUpdated) {
        try {
          console.log("📧 Enviando email de confirmación al paciente...");
          
          const fechaFormateada = formatSpanishDate(sobrecupoFields.Fecha);
          const emailContent = `¡Hola ${patientData.name}!

¡Tu pago ha sido procesado exitosamente! 💳✅

📅 DETALLES DE TU CITA CONFIRMADA:
• Especialidad: ${appointmentData.specialty}
• Fecha: ${fechaFormateada}
• Hora: ${sobrecupoFields.Hora}
• Clínica: ${sobrecupoFields["Clínica"] || sobrecupoFields["Clinica"]}
• Dirección: ${sobrecupoFields["Dirección"] || sobrecupoFields["Direccion"]}

👤 TUS DATOS:
• Nombre: ${patientData.name}
• RUT: ${patientData.rut}
• Teléfono: ${patientData.phone}

💳 PAGO CONFIRMADO:
• Monto: $${parseInt(appointmentData.amount || '2990').toLocaleString('es-CL')} CLP
• ID Transacción: ${transactionId}

📝 RECOMENDACIONES:
• Llega 15 minutos antes de tu cita
• Trae tu cédula de identidad
• El pago ya está procesado

¡Nos vemos pronto!

Saludos,
Equipo Sobrecupos AI`;

          const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              personalizations: [{
                to: [{ email: patientData.email, name: patientData.name }],
                subject: `🩺 Pago confirmado - Cita: ${appointmentData.specialty} - ${fechaFormateada}`
              }],
              from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
              content: [{ type: "text/plain", value: emailContent }]
            })
          });

          if (emailResponse.ok) {
            emailSent = true;
            console.log("✅ Email enviado al paciente exitosamente");
          }

        } catch (emailErr) {
          console.error("⚠️ Error enviando email al paciente:", emailErr);
        }
      }

      // Status final
      statusText = sobrecupoUpdated ? 
        "¡Reserva confirmada y pago procesado exitosamente!" : 
        "Error procesando la reserva";

    } catch (error) {
      console.error("❌ === ERROR PROCESANDO RESERVA ===");
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Error completo:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: statusText,
      details: {
        sobrecupoUpdated,
        pacienteCreated,
        emailSent,
        transactionId
      }
    });

  } catch (error) {
    console.error('❌ === ERROR CONFIRMANDO PAGO ===');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error completo:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error cause:', error.cause);
    
    // Retornar información detallada del error para debugging
    return NextResponse.json({
      success: false,
      error: error.message || 'Error procesando la confirmación de pago',
      errorDetails: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        cause: error.cause
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}