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
      
      // Actualizar sobrecupo con datos del paciente y motivo de consulta
      const updateData = {
        fields: {
          Disponible: "No", // Confirmado y pagado
          // Limpiar campos de timeout (ya no son necesarios)
          "Session ID": null,
          "Payment Timeout": null, 
          "Reserva Timestamp": null,
          // Datos del paciente
          Nombre: String(patientData.name || '').trim(),
          Email: String(patientData.email || '').trim(),
          Telefono: String(patientData.phone || '').trim(),
          RUT: String(patientData.rut || '').trim(),
          ...(edad && edad > 0 ? { Edad: edad } : {}),
          // Motivo de consulta (mismo nombre que en tabla Pacientes)
          ...(motivo ? { "Motivo Consulta": String(motivo).trim() } : {}),
          // Información de pago
          "Transaction ID": transactionId,
          "Payment Confirmed": new Date().toISOString()
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
  <title>Nuevo Sobrecupo Confirmado</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
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
      <p style="margin: 0 0 1rem 0; color: #0369a1; font-size: 0.9rem; font-weight: 600;">
        contacto@sobrecupos.com
      </p>
      
      <!-- Sobrecupo gestionado por logo -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.25rem;">
        <span style="color: #666; font-size: 0.85rem;">Gestionado por</span>
        <svg width="130" height="auto" viewBox="0 0 1000 413" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
          <g transform="translate(0.000000,413.000000) scale(0.100000,-0.100000)" stroke="none">
            <path fill="#dc2626" d="M1173 2946 c-132 -32 -280 -149 -337 -267 -75 -156 -75 -342 1 -493 19 -38 117 -144 382 -411 196 -198 361 -361 366 -363 10 -2 821 806 938 935 47 52 57 69 57 99 0 51 -53 104 -105 104 -32 0 -47 -10 -123 -82 -48 -45 -139 -135 -202 -199 -63 -64 -167 -165 -230 -225 -139 -132 -189 -156 -324 -156 -167 0 -220 29 -407 219 -175 178 -194 211 -194 328 0 67 4 89 28 137 32 65 90 121 156 151 64 30 187 30 252 1 45 -21 254 -205 283 -249 14 -21 11 -26 -55 -95 l-70 -74 -102 101 c-129 127 -151 143 -194 143 -50 0 -103 -54 -103 -104 0 -33 13 -50 133 -178 168 -180 217 -206 321 -176 34 10 92 62 346 313 343 340 344 340 480 340 124 -1 219 -59 278 -170 23 -43 27 -62 27 -140 0 -78 -4 -96 -27 -140 -19 -36 -165 -188 -517 -540 -270 -269 -491 -495 -491 -500 0 -14 133 -145 146 -145 21 0 1005 1003 1035 1055 48 82 69 165 69 269 0 150 -47 268 -146 370 -100 102 -231 156 -381 156 -173 0 -259 -43 -442 -220 l-134 -129 -131 125 c-141 135 -195 173 -295 204 -73 23 -205 26 -288 6z"/>
            <path fill="#171717" d="M4440 2285 l0 -485 105 0 105 0 0 30 0 31 38 -30 c135 -107 369 -24 428 152 22 65 22 169 0 234 -23 68 -83 135 -153 169 -95 47 -224 34 -290 -28 l-23 -21 0 216 0 217 -105 0 -105 0 0 -485z m411 -71 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -59 59 -47 163 25 207 33 21 103 22 142 1z"/>
            <path fill="#171717" d="M3377 2409 c-114 -27 -188 -122 -173 -225 10 -75 54 -118 141 -138 84 -20 106 -28 115 -46 8 -14 8 -26 0 -40 -16 -30 -99 -27 -168 5 -30 14 -55 25 -57 25 -5 0 -75 -132 -75 -141 0 -3 28 -19 62 -34 84 -38 209 -46 294 -19 117 37 183 145 154 253 -20 74 -49 95 -199 142 -53 17 -71 40 -51 64 13 16 47 17 150 3 21 -3 29 5 57 57 17 33 28 63 24 68 -12 12 -142 37 -191 36 -25 -1 -62 -5 -83 -10z"/>
            <path fill="#171717" d="M3935 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
            <path fill="#171717" d="M6551 2409 c-108 -18 -191 -84 -238 -187 -22 -46 -24 -65 -21 -135 4 -99 30 -158 96 -219 84 -77 205 -106 315 -74 l57 17 0 90 0 90 -28 -15 c-15 -8 -41 -15 -57 -17 -68 -5 -87 1 -126 40 -36 35 -39 43 -39 92 0 66 15 96 59 126 40 27 112 30 151 8 14 -8 28 -14 33 -15 4 0 7 38 7 86 l0 85 -32 13 c-48 20 -115 25 -177 15z"/>
            <path fill="#171717" d="M7812 2402 c-29 -11 -64 -30 -77 -42 l-25 -23 0 31 0 32 -105 0 -105 0 0 -450 0 -450 105 0 105 0 0 176 0 176 23 -16 c51 -38 92 -50 167 -50 92 -1 156 29 218 99 52 59 75 129 75 223 -1 61 -6 83 -32 137 -68 137 -216 204 -349 157z m99 -188 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -41 41 -48 93 -23 156 24 60 123 87 190 52z"/>
            <path fill="#171717" d="M8465 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
            <path fill="#171717" d="M9148 2406 c-106 -28 -168 -103 -168 -200 0 -93 34 -128 162 -164 91 -26 93 -28 96 -59 3 -28 -1 -33 -23 -39 -40 -10 -108 1 -157 25 -24 11 -47 21 -49 21 -3 0 -21 -32 -39 -71 -34 -70 -34 -71 -15 -85 11 -8 51 -24 89 -36 55 -17 85 -20 156 -16 110 7 179 40 222 108 27 41 29 52 26 115 -5 104 -50 151 -169 176 -69 15 -89 25 -89 48 0 32 26 44 83 38 28 -3 62 -8 74 -12 19 -6 26 1 53 56 38 75 34 81 -64 98 -79 14 -128 13 -188 -3z"/>
            <path fill="#171717" d="M5533 2400 c-55 -11 -97 -34 -122 -65 l-20 -26 -3 43 -3 43 -105 0 -105 0 -3 -297 -2 -298 109 0 110 0 3 176 3 176 39 35 c38 35 39 35 113 31 l74 -5 -3 96 c-3 108 -3 107 -85 91z"/>
            <path fill="#171717" d="M5819 2396 c-131 -47 -202 -152 -203 -301 0 -188 117 -303 317 -313 147 -7 241 34 296 130 17 29 31 56 31 61 0 4 -45 7 -99 7 -93 0 -102 -2 -127 -25 -49 -46 -160 -30 -190 26 -8 16 -14 39 -14 54 l0 25 221 0 222 0 -6 65 c-12 126 -82 227 -185 265 -62 24 -205 27 -263 6z m223 -155 c50 -56 43 -61 -91 -61 l-120 0 11 31 c26 75 144 93 200 30z"/>
            <path fill="#171717" d="M6800 2189 c0 -240 7 -276 61 -330 55 -55 133 -80 249 -81 125 -1 197 20 255 73 65 60 70 82 70 329 l0 215 -105 0 -105 0 -2 -190 c-2 -115 -7 -198 -14 -211 -25 -49 -119 -60 -166 -20 l-28 24 -3 201 -3 201 -105 0 -104 0 0 -211z"/>
          </g>
        </svg>
      </div>
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
                      subject: `🎉 Nuevo sobrecupo confirmado: ${patientData.name} - ${fechaFormateada}`
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
          
          // 🏥 FUNCIÓN PARA MANEJAR TÍTULO DEL MÉDICO
          function procesarNombreMedico(nombreCompleto) {
            console.log('🔍 [EMAIL DEBUG] Procesando nombre médico:', {
              input: nombreCompleto,
              type: typeof nombreCompleto,
              length: nombreCompleto?.length
            });
            
            if (!nombreCompleto || nombreCompleto.trim() === '') {
              console.log('⚠️ [EMAIL DEBUG] Nombre médico vacío, usando fallback');
              return { titulo: 'Dr.', nombre: 'Médico' };
            }
            
            // Convertir a string y limpiar
            const nombreStr = String(nombreCompleto).trim();
            
            // Remover títulos existentes y limpiar
            const nombreLimpio = nombreStr
              .replace(/^(Dr\.|Dra\.|Doctor|Doctora)\s*/i, '')
              .trim();
            
            console.log('🔍 [EMAIL DEBUG] Nombre procesado:', {
              original: nombreStr,
              limpio: nombreLimpio
            });
            
            // Si después de limpiar no queda nada, usar el nombre original
            const nombreFinal = nombreLimpio || nombreStr;
            
            // Detectar género por nombres comunes femeninos
            const nombresFemeninos = [
              'María', 'Carmen', 'Ana', 'Isabel', 'Pilar', 'Dolores', 'Josefa', 'Rosa', 'Antonia', 'Francisca',
              'Laura', 'Cristina', 'Marta', 'Elena', 'Teresa', 'Patricia', 'Sandra', 'Monica', 'Andrea', 'Claudia',
              'Valentina', 'Camila', 'Fernanda', 'Alejandra', 'Daniela', 'Carolina', 'Javiera', 'Constanza',
              'Esperanza', 'Soledad', 'Amparo', 'Concepción', 'Remedios', 'Encarnación', 'Asunción'
            ];
            
            const primerNombreMedico = nombreFinal.split(' ')[0];
            const esFemenino = nombresFemeninos.some(nombre => 
              primerNombreMedico.toLowerCase().includes(nombre.toLowerCase())
            );
            
            const resultado = {
              titulo: esFemenino ? 'Dra.' : 'Dr.',
              nombre: nombreFinal
            };
            
            console.log('✅ [EMAIL DEBUG] Resultado final:', resultado);
            return resultado;
          }
          
          console.log('🔍 [EMAIL DEBUG] appointmentData completo:', appointmentData);
          console.log('🔍 [EMAIL DEBUG] appointmentData.doctorName:', appointmentData.doctorName);
          console.log('🔍 [EMAIL DEBUG] appointmentData.doctor:', appointmentData.doctor);
          console.log('🔍 [EMAIL DEBUG] Using doctor name:', appointmentData.doctorName || appointmentData.doctor);
          
          const doctorNameForEmail = appointmentData.doctorName || appointmentData.doctor;
          const { titulo, nombre } = procesarNombreMedico(doctorNameForEmail);
          const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu Sobrecupo médico confirmado!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
    
    <!-- Content -->
    <div style="padding: 2rem;">
      
      <!-- Mensaje Personal del Médico -->
      <div style="margin-bottom: 1.5rem; background: #f8fafc; border-left: 4px solid #3b82f6; padding: 1.5rem; border-radius: 8px;">
        <p style="margin: 0; color: #1f2937; font-size: 1rem; line-height: 1.6; font-weight: 500;">
          Hola ${primerNombre}, yo ${titulo} ${nombre}, te autoricé Sobrecupo para el día ${fechaFormateada} a las ${sobrecupoFields.Hora} en ${nombreClinica} que queda ${direccionClinica}.
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
      <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">
        Si tienes alguna consulta, escríbenos a
      </p>
      <p style="margin: 0 0 1rem 0; color: #0369a1; font-size: 0.9rem; font-weight: 600;">
        contacto@sobrecupos.com
      </p>
      
      <!-- Sobrecupo gestionado por logo -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 0.25rem;">
        <span style="color: #666; font-size: 0.85rem;">Gestionado por</span>
        <svg width="130" height="auto" viewBox="0 0 1000 413" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
          <g transform="translate(0.000000,413.000000) scale(0.100000,-0.100000)" stroke="none">
            <path fill="#dc2626" d="M1173 2946 c-132 -32 -280 -149 -337 -267 -75 -156 -75 -342 1 -493 19 -38 117 -144 382 -411 196 -198 361 -361 366 -363 10 -2 821 806 938 935 47 52 57 69 57 99 0 51 -53 104 -105 104 -32 0 -47 -10 -123 -82 -48 -45 -139 -135 -202 -199 -63 -64 -167 -165 -230 -225 -139 -132 -189 -156 -324 -156 -167 0 -220 29 -407 219 -175 178 -194 211 -194 328 0 67 4 89 28 137 32 65 90 121 156 151 64 30 187 30 252 1 45 -21 254 -205 283 -249 14 -21 11 -26 -55 -95 l-70 -74 -102 101 c-129 127 -151 143 -194 143 -50 0 -103 -54 -103 -104 0 -33 13 -50 133 -178 168 -180 217 -206 321 -176 34 10 92 62 346 313 343 340 344 340 480 340 124 -1 219 -59 278 -170 23 -43 27 -62 27 -140 0 -78 -4 -96 -27 -140 -19 -36 -165 -188 -517 -540 -270 -269 -491 -495 -491 -500 0 -14 133 -145 146 -145 21 0 1005 1003 1035 1055 48 82 69 165 69 269 0 150 -47 268 -146 370 -100 102 -231 156 -381 156 -173 0 -259 -43 -442 -220 l-134 -129 -131 125 c-141 135 -195 173 -295 204 -73 23 -205 26 -288 6z"/>
            <path fill="#171717" d="M4440 2285 l0 -485 105 0 105 0 0 30 0 31 38 -30 c135 -107 369 -24 428 152 22 65 22 169 0 234 -23 68 -83 135 -153 169 -95 47 -224 34 -290 -28 l-23 -21 0 216 0 217 -105 0 -105 0 0 -485z m411 -71 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -59 59 -47 163 25 207 33 21 103 22 142 1z"/>
            <path fill="#171717" d="M3377 2409 c-114 -27 -188 -122 -173 -225 10 -75 54 -118 141 -138 84 -20 106 -28 115 -46 8 -14 8 -26 0 -40 -16 -30 -99 -27 -168 5 -30 14 -55 25 -57 25 -5 0 -75 -132 -75 -141 0 -3 28 -19 62 -34 84 -38 209 -46 294 -19 117 37 183 145 154 253 -20 74 -49 95 -199 142 -53 17 -71 40 -51 64 13 16 47 17 150 3 21 -3 29 5 57 57 17 33 28 63 24 68 -12 12 -142 37 -191 36 -25 -1 -62 -5 -83 -10z"/>
            <path fill="#171717" d="M3935 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
            <path fill="#171717" d="M6551 2409 c-108 -18 -191 -84 -238 -187 -22 -46 -24 -65 -21 -135 4 -99 30 -158 96 -219 84 -77 205 -106 315 -74 l57 17 0 90 0 90 -28 -15 c-15 -8 -41 -15 -57 -17 -68 -5 -87 1 -126 40 -36 35 -39 43 -39 92 0 66 15 96 59 126 40 27 112 30 151 8 14 -8 28 -14 33 -15 4 0 7 38 7 86 l0 85 -32 13 c-48 20 -115 25 -177 15z"/>
            <path fill="#171717" d="M7812 2402 c-29 -11 -64 -30 -77 -42 l-25 -23 0 31 0 32 -105 0 -105 0 0 -450 0 -450 105 0 105 0 0 176 0 176 23 -16 c51 -38 92 -50 167 -50 92 -1 156 29 218 99 52 59 75 129 75 223 -1 61 -6 83 -32 137 -68 137 -216 204 -349 157z m99 -188 c40 -20 73 -92 63 -137 -24 -113 -149 -151 -230 -71 -41 41 -48 93 -23 156 24 60 123 87 190 52z"/>
            <path fill="#171717" d="M8465 2407 c-104 -28 -180 -87 -226 -177 -34 -65 -33 -194 1 -265 32 -65 89 -121 159 -154 50 -23 68 -26 171 -26 103 0 121 3 171 26 70 33 127 89 159 154 34 70 34 189 2 260 -53 115 -164 185 -306 191 -47 2 -102 -2 -131 -9z m183 -193 c42 -27 64 -74 59 -127 -10 -118 -155 -170 -234 -83 -18 19 -35 47 -39 61 -15 61 21 135 80 161 36 16 100 10 134 -12z"/>
            <path fill="#171717" d="M9148 2406 c-106 -28 -168 -103 -168 -200 0 -93 34 -128 162 -164 91 -26 93 -28 96 -59 3 -28 -1 -33 -23 -39 -40 -10 -108 1 -157 25 -24 11 -47 21 -49 21 -3 0 -21 -32 -39 -71 -34 -70 -34 -71 -15 -85 11 -8 51 -24 89 -36 55 -17 85 -20 156 -16 110 7 179 40 222 108 27 41 29 52 26 115 -5 104 -50 151 -169 176 -69 15 -89 25 -89 48 0 32 26 44 83 38 28 -3 62 -8 74 -12 19 -6 26 1 53 56 38 75 34 81 -64 98 -79 14 -128 13 -188 -3z"/>
            <path fill="#171717" d="M5533 2400 c-55 -11 -97 -34 -122 -65 l-20 -26 -3 43 -3 43 -105 0 -105 0 -3 -297 -2 -298 109 0 110 0 3 176 3 176 39 35 c38 35 39 35 113 31 l74 -5 -3 96 c-3 108 -3 107 -85 91z"/>
            <path fill="#171717" d="M5819 2396 c-131 -47 -202 -152 -203 -301 0 -188 117 -303 317 -313 147 -7 241 34 296 130 17 29 31 56 31 61 0 4 -45 7 -99 7 -93 0 -102 -2 -127 -25 -49 -46 -160 -30 -190 26 -8 16 -14 39 -14 54 l0 25 221 0 222 0 -6 65 c-12 126 -82 227 -185 265 -62 24 -205 27 -263 6z m223 -155 c50 -56 43 -61 -91 -61 l-120 0 11 31 c26 75 144 93 200 30z"/>
            <path fill="#171717" d="M6800 2189 c0 -240 7 -276 61 -330 55 -55 133 -80 249 -81 125 -1 197 20 255 73 65 60 70 82 70 329 l0 215 -105 0 -105 0 -2 -190 c-2 -115 -7 -198 -14 -211 -25 -49 -119 -60 -166 -20 l-28 24 -3 201 -3 201 -105 0 -104 0 0 -211z"/>
          </g>
        </svg>
      </div>
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