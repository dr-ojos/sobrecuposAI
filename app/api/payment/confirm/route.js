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
      appointmentData,
      motivo = null // 🆕 MOTIVO DE CONSULTA
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
      // 1. CREAR PACIENTE EN TABLA PACIENTES
      let pacienteId = null;
      console.log("🔍 Verificando creación de paciente...");
      console.log("🔍 AIRTABLE_PATIENTS_TABLE:", process.env.AIRTABLE_PATIENTS_TABLE);
      
      if (process.env.AIRTABLE_PATIENTS_TABLE) {
        try {
          console.log("👤 === CREANDO PACIENTE EN TABLA PACIENTES ===");
          console.log("👤 Datos del paciente:", patientData);
          
          const edadPaciente = patientData.age ? parseInt(String(patientData.age), 10) : null;
          console.log("👤 Edad procesada:", edadPaciente);
          
          const pacienteDataForCreation = {
            fields: {
              Nombre: String(patientData.name || '').trim(),
              RUT: String(patientData.rut || '').trim(),
              Telefono: String(patientData.phone || '').trim(),
              Email: String(patientData.email || '').trim(),
              ...(edadPaciente && edadPaciente > 0 ? { Edad: edadPaciente } : {}),
              "Fecha Registro": new Date().toISOString().split('T')[0],
              // 🆕 NUEVOS CAMPOS SOLICITADOS
              ...(motivo ? { "Motivo Consulta": String(motivo).trim() } : {}),
              "Estado Pago": "Pagado",
              "ID Transaccion": transactionId
            }
          };
          
          console.log("👤 Datos para creación (antes de limpiar):", pacienteDataForCreation);
          
          // Limpiar campos vacíos
          Object.keys(pacienteDataForCreation.fields).forEach(key => {
            const value = pacienteDataForCreation.fields[key];
            if (value === '' || value === 'N/A' || value === null || value === undefined) {
              console.log("🧹 Removiendo campo vacío:", key);
              delete pacienteDataForCreation.fields[key];
            }
          });
          
          console.log("👤 Datos finales para creación:", pacienteDataForCreation);
          
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

          console.log("📡 Response status:", pacienteResponse.status);
          console.log("📡 Response ok:", pacienteResponse.ok);
          
          if (pacienteResponse.ok) {
            const pacienteResult = await pacienteResponse.json();
            pacienteId = pacienteResult.id;
            pacienteCreated = true;
            console.log("✅ Paciente creado exitosamente:", pacienteId);
            console.log("✅ Datos del paciente creado:", pacienteResult);
          } else {
            const errorData = await pacienteResponse.json();
            console.error("❌ Error creando paciente - Status:", pacienteResponse.status);
            console.error("❌ Error creando paciente - Detalles:", errorData);
          }

        } catch (pacienteErr) {
          console.error("⚠️ Error de conexión creando paciente:", pacienteErr);
        }
      }

      // 2. ACTUALIZAR SOBRECUPO (CRÍTICO)
      console.log("📅 === ACTUALIZANDO SOBRECUPO ===");
      console.log("🆔 Sobrecupo ID:", sobrecupoId);
      
      // Preparar los datos con validación estricta
      const edad = patientData.age ? parseInt(String(patientData.age), 10) : null;
      
      // Solo actualizar campos que SABEMOS que existen en Airtable
      const updateData = {
        fields: {
          Disponible: "No"
          // Remover todos los campos que no existen hasta confirmar estructura
        }
      };

      // Limpiar campos vacíos que pueden causar errores en Airtable
      Object.keys(updateData.fields).forEach(key => {
        const value = updateData.fields[key];
        if (value === '' || value === 'N/A' || value === null || value === undefined) {
          delete updateData.fields[key];
        }
      });

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
          console.log("📱 === INICIANDO NOTIFICACIONES AL MÉDICO ===");
          
          const medicoId = Array.isArray(sobrecupoFields["Médico"]) ? 
            sobrecupoFields["Médico"][0] : sobrecupoFields["Médico"];
          
          console.log("🩺 Médico ID obtenido:", medicoId);
          
          const doctorInfo = await getDoctorInfo(medicoId);
          console.log("🩺 Doctor info obtenido:", doctorInfo);
          
          if (doctorInfo.whatsapp) {
            const fechaFormateada = formatSpanishDate(sobrecupoFields.Fecha);
            console.log("📅 Fecha formateada:", fechaFormateada);
            
            // WhatsApp al médico
            console.log("📱 Intentando enviar WhatsApp al médico...");
            const whatsappResult = await whatsAppService.notifyDoctorNewPatient(
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
              },
              motivo // 🆕 AGREGAR MOTIVO AL WHATSAPP
            );
            
            console.log("📱 ✅ Resultado WhatsApp:", whatsappResult);
            
            // Email al médico
            if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL && doctorInfo.email) {
              try {
                const doctorEmailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Sobrecupo - SobrecuposIA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #171717 0%, #404040 100%); color: white; padding: 2rem; text-align: center;">
      <h1 style="margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.025em;">
        🩺 SobrecuposIA
      </h1>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">
        Sistema de gestión médica
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 2rem;">
      
      <!-- Greeting -->
      <div style="margin-bottom: 1.5rem;">
        <h2 style="margin: 0 0 0.5rem 0; color: #171717; font-size: 1.25rem; font-weight: 600;">
          ¡Hola Dr/a. ${doctorInfo.name}!
        </h2>
        <p style="margin: 0; color: #666; font-size: 1rem; line-height: 1.5;">
          Tienes un nuevo sobrecupo disponible para tu agenda.
        </p>
      </div>

      <!-- Success Badge -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
        <span style="color: #0369a1; font-size: 1rem; font-weight: 600;">
          🎉 ¡Nuevo Sobrecupo Confirmado!
        </span>
      </div>

      <!-- Appointment Details -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          📅 Detalles de la Cita
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Fecha:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${fechaFormateada}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Hora:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${sobrecupoFields.Hora}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Especialidad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${appointmentData.specialty}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Clínica:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${sobrecupoFields["Clínica"] || sobrecupoFields["Clinica"] || "Clínica"}</td>
          </tr>
        </table>
      </div>

      <!-- Patient Details -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          👤 Datos del Paciente
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Nombre:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${patientData.name}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">RUT:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${patientData.rut}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Teléfono:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${patientData.phone}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Email:</td>
            <td style="padding: 0.5rem 0; color: #0369a1; font-size: 0.9rem;">${patientData.email}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Edad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${patientData.age} años</td>
          </tr>${motivo ? `
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Motivo:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; background: #fef3c7; padding: 0.5rem; border-radius: 4px; font-style: italic;">${motivo}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Status Confirmation -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; text-align: center; margin-bottom: 1.5rem;">
        <span style="color: #166534; font-size: 0.9rem; font-weight: 600;">
          ✅ El paciente ha confirmado su asistencia
        </span>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-top: 1px solid #e5e5e5; padding: 1.5rem; text-align: center;">
      <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.85rem;">
        Este es un mensaje automático del sistema
      </p>
      <p style="margin: 0; color: #171717; font-size: 0.9rem; font-weight: 600;">
        SobrecuposIA
      </p>
    </div>

  </div>
</body>
</html>`;

                const doctorEmailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${SENDGRID_API_KEY}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    personalizations: [{
                      to: [{ email: doctorInfo.email, name: doctorInfo.name }],
                      subject: `👨‍⚕️ Nuevo sobrecupo: ${patientData.name} - ${fechaFormateada}`
                    }],
                    from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos AI" },
                    content: [{ type: "text/html", value: doctorEmailContent }]
                  })
                });

                if (doctorEmailResponse.ok) {
                  console.log("✅ Email enviado al médico exitosamente");
                }
              } catch (doctorEmailErr) {
                console.error("⚠️ Error enviando email al médico:", doctorEmailErr);
              }
            }
          } else {
            console.log("⚠️ Doctor no tiene WhatsApp configurado:", {
              doctorInfo,
              whatsapp: doctorInfo.whatsapp
            });
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
          const primerNombre = patientData.name.split(' ')[0];
          const nombreClinica = sobrecupoFields["Clínica"] || sobrecupoFields["Clinica"] || "Clínica";
          const direccionClinica = sobrecupoFields["Dirección"] || sobrecupoFields["Direccion"] || "";
          const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Confirmada - SobrecuposIA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #171717 0%, #404040 100%); color: white; padding: 2rem; text-align: center;">
      <h1 style="margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.025em;">
        🩺 SobrecuposIA
      </h1>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">
        Tu cita médica confirmada
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 2rem;">
      
      <!-- Mensaje Personal del Médico -->
      <div style="margin-bottom: 1.5rem; background: #f8fafc; border-left: 4px solid #3b82f6; padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0; color: #1f2937; font-size: 1rem; line-height: 1.6; font-weight: 500;">
          Hola ${primerNombre}, yo Dr. ${appointmentData.doctorName}, te autoricé Sobrecupo para el día ${fechaFormateada} a las ${sobrecupoFields.Hora} en ${nombreClinica} que queda ${direccionClinica}.
        </p>
        <p style="margin: 0.75rem 0 0 0; color: #1f2937; font-size: 1rem; line-height: 1.6; font-weight: 600;">
          Recuerda mostrar esto en caja y pagar tu consulta.
        </p>
      </div>

      <!-- Status de Confirmación -->
      <div style="margin-bottom: 1.5rem;">
        <p style="margin: 0; color: #666; font-size: 1rem; line-height: 1.5;">
          Tu pago ha sido procesado exitosamente y tu cita está confirmada.
        </p>
      </div>

      <!-- Success Badge -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: center;">
        <span style="color: #166534; font-size: 1rem; font-weight: 600;">
          ✅ ¡Cita Confirmada Exitosamente!
        </span>
      </div>

      <!-- Appointment Details -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          📅 Detalles de tu Cita
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Especialidad:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${appointmentData.specialty}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Fecha:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${fechaFormateada}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Hora:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${sobrecupoFields.Hora}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Clínica:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${sobrecupoFields["Clínica"] || sobrecupoFields["Clinica"]}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Dirección:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${sobrecupoFields["Dirección"] || sobrecupoFields["Direccion"]}</td>
          </tr>
        </table>
      </div>

      <!-- Patient Data -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #171717; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem;">
          👤 Tus Datos
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Nombre:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem; font-weight: 600;">${patientData.name}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">RUT:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${patientData.rut}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">Teléfono:</td>
            <td style="padding: 0.5rem 0; color: #171717; font-size: 0.9rem;">${patientData.phone}</td>
          </tr>
        </table>
      </div>

      <!-- Payment Confirmation -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #0369a1; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #bae6fd; padding-bottom: 0.5rem;">
          💳 Pago Confirmado
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500; width: 100px;">Monto:</td>
            <td style="padding: 0.5rem 0; color: #0369a1; font-size: 0.9rem; font-weight: 600;">$${parseInt(appointmentData.amount || '2990').toLocaleString('es-CL')} CLP</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #666; font-size: 0.9rem; font-weight: 500;">ID Transacción:</td>
            <td style="padding: 0.5rem 0; color: #0369a1; font-size: 0.85rem; font-family: monospace;">${transactionId}</td>
          </tr>
        </table>
      </div>

      <!-- Recommendations -->
      <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem 0; color: #92400e; font-size: 1rem; font-weight: 600; border-bottom: 2px solid #fcd34d; padding-bottom: 0.5rem;">
          📝 Recomendaciones Importantes
        </h3>
        <ul style="margin: 0; padding-left: 1.5rem; color: #92400e; font-size: 0.9rem; line-height: 1.6;">
          <li style="margin-bottom: 0.5rem;"><strong>Llega 15 minutos antes</strong> de tu cita</li>
          <li style="margin-bottom: 0.5rem;">Trae tu <strong>cédula de identidad</strong></li>
          <li style="margin-bottom: 0.5rem;"><strong>Importante:</strong> La autorización de Sobrecupos no reemplaza al pago de la consulta, la cual debe ser cancelada en la consulta después de mostrar la autorización de sobrecupo que te envía tu médico.</li>
        </ul>
      </div>

      <!-- Final Message -->
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <p style="margin: 0; color: #171717; font-size: 1rem; font-weight: 600;">
          ¡Nos vemos pronto! 🎉
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; border-top: 1px solid #e5e5e5; padding: 1.5rem; text-align: center;">
      <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.85rem;">
        Si tienes alguna consulta, responde a este email
      </p>
      <p style="margin: 0; color: #171717; font-size: 0.9rem; font-weight: 600;">
        Equipo SobrecuposIA
      </p>
    </div>

  </div>
</body>
</html>`;

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
              content: [{ type: "text/html", value: emailContent }]
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