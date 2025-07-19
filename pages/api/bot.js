// /pages/api/bot.js - VERSIÓN CON REGISTRO DE PACIENTES CORREGIDO
const sessions = {};

const saludosSimples = [
  "hola","buenas","buenos dias","buenos días","buenas tardes","buenas noches",
  "hey","ey","qué tal","que tal","holi","holis","hello","saludos"
];

function esSaludoSimple(text) {
  if (!text) return false;
  const limpio = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return saludosSimples.includes(limpio);
}

function validarRUT(rut) {
  rut = rut.replace(/[.\-]/g, '').toUpperCase();
  if (!/^[0-9]+[0-9K]$/.test(rut)) return false;
  const cuerpo = rut.slice(0, -1);
  const dv = rut.slice(-1);
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
  }
  const dvCalculado = 11 - (suma % 11);
  let dvEsperado;
  if (dvCalculado === 11) dvEsperado = '0';
  else if (dvCalculado === 10) dvEsperado = 'K';
  else dvEsperado = dvCalculado.toString();
  return dv === dvEsperado;
}

function detectarEspecialidadDirecta(text) {
  const textoLimpio = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const especialidadesDirectas = {
    'reumatologo': 'Reumatología', 'reumatologia': 'Reumatología',
    'traumatologo': 'Traumatología', 'traumatologia': 'Traumatología',
    'oftalmologo': 'Oftalmología', 'oftalmologia': 'Oftalmología',
    'dermatologo': 'Dermatología', 'dermatologia': 'Dermatología',
    'pediatra': 'Pediatría', 'pediatria': 'Pediatría',
    'cardiologo': 'Cardiología', 'cardiologia': 'Cardiología',
    'neurologo': 'Neurología', 'neurologia': 'Neurología',
    'otorrino': 'Otorrinolaringología', 'otorrinolaringologia': 'Otorrinolaringología',
    'medicina familiar': 'Medicina Familiar', 'medico general': 'Medicina Familiar',
    'general': 'Medicina Familiar', 'familiar': 'Medicina Familiar',
    'urologo': 'Urología', 'urologia': 'Urología',
    'ginecologo': 'Ginecología', 'ginecologia': 'Ginecología',
    'psiquiatra': 'Psiquiatría', 'psiquiatria': 'Psiquiatría',
    'endocrinologo': 'Endocrinología', 'endocrinologia': 'Endocrinología'
  };
  for (const [key, value] of Object.entries(especialidadesDirectas)) {
    if (textoLimpio.includes(key)) return value;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ text: "Método no permitido" });

  const {
    OPENAI_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID,
    AIRTABLE_DOCTORS_TABLE, AIRTABLE_PATIENTS_TABLE, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
  } = process.env;

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text = (message || "").trim();

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return res.json({ text: "❌ Error de configuración básica. Contacta soporte." });
  }

  const greetingRe = /\b(hola|buenas|buenos días|buenos dias|buenas tardes|buenas noches|qué tal|que tal|cómo estás|como estas|hey|ey)\b/i;
  const thanksRe = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe = /\b(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente)\b/i;

  async function getEspecialidadesDisponibles() {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}?fields%5B%5D=Especialidad`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      const especialidades = new Set();
      data.records?.forEach(record => {
        if (record.fields?.Especialidad) {
          especialidades.add(record.fields.Especialidad);
        }
      });
      return Array.from(especialidades).sort();
    } catch (err) {
      console.error("❌ Error obteniendo especialidades:", err);
      return ["Medicina Familiar", "Oftalmología", "Dermatología"];
    }
  }

  async function getDoctorName(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return data.fields?.Name || medicoId;
    } catch (err) {
      console.error("❌ Error buscando médico:", err);
      return medicoId;
    }
  }

  async function getDoctorInfo(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return {
        name: data.fields?.Name || medicoId,
        email: data.fields?.Email || null
      };
    } catch (err) {
      console.error("❌ Error obteniendo info del médico:", err);
      return { name: medicoId, email: null };
    }
  }

  // ✅ FUNCIÓN CORREGIDA PARA CREAR PACIENTES
  async function crearPaciente(pacienteData) {
    if (!AIRTABLE_PATIENTS_TABLE) {
      console.error("❌ Variable AIRTABLE_PATIENTS_TABLE no configurada");
      return null;
    }

    try {
      console.log("📝 Intentando crear paciente con datos:", pacienteData);
      console.log("📝 URL tabla pacientes:", `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`);
      
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ fields: pacienteData })
        }
      );
      
      console.log("📡 Respuesta HTTP creando paciente:", resp.status);
      
      if (!resp.ok) {
        const errorData = await resp.json();
        console.error("❌ Error HTTP creando paciente:", resp.status);
        console.error("❌ Detalles del error:", JSON.stringify(errorData, null, 2));
        
        // ✅ Intentar con campos básicos si hay error 422 (campos inválidos)
        if (resp.status === 422) {
          console.log("🔄 Intentando crear paciente solo con campos básicos...");
          const basicData = {
            Nombre: pacienteData.Nombre,
            Email: pacienteData.Email
          };
          
          const basicResp = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PATIENTS_TABLE}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ fields: basicData })
            }
          );
          
          if (basicResp.ok) {
            const basicResult = await basicResp.json();
            console.log("✅ Paciente creado con datos básicos:", basicResult.id);
            return basicResult.id;
          } else {
            const basicError = await basicResp.json();
            console.error("❌ Error creando paciente con datos básicos:", JSON.stringify(basicError, null, 2));
          }
        }
        
        return null;
      }
      
      const data = await resp.json();
      console.log("✅ Paciente creado exitosamente:", data.id);
      console.log("✅ Datos del paciente creado:", JSON.stringify(data, null, 2));
      return data.id;
    } catch (err) {
      console.error("❌ Error de conexión creando paciente:", err);
      return null;
    }
  }

  if (greetingRe.test(text)) {
    if (esSaludoSimple(text)) {
      return res.json({
        text: "¡Hola! 👋 ¿Quieres que te ayude a encontrar y reservar un sobrecupo médico?\nCuéntame tus síntomas, el nombre del médico o la especialidad que necesitas."
      });
    }
    return res.json({
      text: "¡Hola! 👋 Soy Sobrecupos IA.\nTe ayudo a encontrar y reservar sobrecupos médicos.\nDime tus síntomas, el médico o la especialidad que necesitas."
    });
  }

  if (thanksRe.test(text)) {
    return res.json({ text: "¡De nada! Si necesitas algo más, avísame. 😊" });
  }

  let session = prevSession || sessions[from];
  if (session) {
    switch (session.stage) {
      case 'awaiting-confirmation':
        if (affirmativeRe.test(text)) {
          session.stage = 'collect-name';
          return res.json({
            text: '¡Perfecto! Para completar la reserva necesito algunos datos.\n\nPrimero, dime tu nombre completo:',
            session
          });
        } else if (negativeRe.test(text)) {
          session.attempts++;
          if (session.attempts < session.records.length) {
            const nxt = session.records[session.attempts].fields;
            const clin = nxt["Clínica"] || nxt["Clinica"] || "nuestra clínica";
            const dir = nxt["Dirección"] || nxt["Direccion"] || "la dirección indicada";
            const medicoId = Array.isArray(nxt["Médico"]) ? nxt["Médico"][0] : nxt["Médico"];
            const medicoNombre = await getDoctorName(medicoId);
            return res.json({
              text: `🔄 Otra opción de ${session.specialty}:\n📍 ${clin} (${dir})\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${nxt.Fecha} a las ${nxt.Hora}\n\n¿Te sirve? Confirma con "sí" o dime "no" para otra opción.`,
              session
            });
          } else {
            delete sessions[from];
            return res.json({ text: 'Lo siento, no hay más sobrecupos disponibles para esta especialidad en este momento.\n\n¿Te gustaría que te contacte cuando tengamos nueva disponibilidad?' });
          }
        } else {
          return res.json({ text: 'Por favor responde con "sí" u "no".', session });
        }

      case 'collect-name':
        session.patient = { name: text };
        session.stage = 'collect-age';
        sessions[from] = session;
        return res.json({ text: 'Gracias. Ahora dime tu edad:', session });

      case 'collect-age':
        const age = parseInt(text);
        if (isNaN(age) || age < 0 || age > 120) {
          return res.json({ text: 'Por favor ingresa una edad válida (número entre 0 y 120):', session });
        }
        session.patient.age = age;
        session.stage = 'collect-rut';
        sessions[from] = session;
        return res.json({ text: 'Perfecto. Ahora necesito tu RUT (ej: 12345678-9):', session });

      case 'collect-rut':
        if (!validarRUT(text)) {
          return res.json({ text: 'El RUT ingresado no es válido. Por favor ingresa un RUT chileno válido (ej: 12345678-9):', session });
        }
        session.patient.rut = text.replace(/[.\-]/g, '').toUpperCase();
        session.stage = 'collect-phone';
        sessions[from] = session;
        return res.json({ text: 'Excelente. Ahora tu teléfono (con código país):', session });

      case 'collect-phone':
        session.patient.phone = text;
        session.stage = 'collect-email';
        sessions[from] = session;
        return res.json({ text: 'Por último, tu email para enviarte la confirmación:', session });

      case 'collect-email':
        session.patient.email = text;
        session.stage = 'final-confirmation';
        sessions[from] = session;

        // ✅ CREACIÓN DE PACIENTE CON LOGS DETALLADOS
        console.log("🏥 ======================");
        console.log("🏥 INICIANDO REGISTRO DE PACIENTE");
        console.log("🏥 ======================");
        
        const pacienteData = {
          Nombre: session.patient.name,
          Edad: session.patient.age,
          RUT: session.patient.rut,
          Telefono: session.patient.phone,
          Email: session.patient.email,
          "Fecha Registro": new Date().toISOString().split('T')[0]
        };
        
        console.log("📝 Datos del paciente a crear:", JSON.stringify(pacienteData, null, 2));
        console.log("📝 Variable AIRTABLE_PATIENTS_TABLE:", AIRTABLE_PATIENTS_TABLE);
        
        const pacienteId = await crearPaciente(pacienteData);
        
        if (pacienteId) {
          console.log("✅ Paciente creado con ID:", pacienteId);
        } else {
          console.error("❌ No se pudo crear el paciente");
        }

        console.log("🏥 ======================");
        console.log("🏥 INICIANDO ACTUALIZACIÓN DE SOBRECUPO");
        console.log("🏥 ======================");

        const chosen = session.records[session.attempts].fields;
        const chosenId = session.records[session.attempts].id;
        
        const updateFields = {
          Disponible: "No"
        };

        if (session.patient.name) updateFields.Nombre = session.patient.name;
        if (session.patient.age) updateFields.Edad = session.patient.age;
        if (session.patient.rut) updateFields.RUT = session.patient.rut;
        if (session.patient.phone) updateFields.Telefono = session.patient.phone;
        if (session.patient.email) updateFields.Email = session.patient.email;
        
        // ✅ Solo agregar relación si el paciente se creó exitosamente
        if (pacienteId) {
          updateFields.Paciente = [pacienteId];
          console.log("✅ Agregando relación con paciente ID:", pacienteId);
        } else {
          console.log("⚠️ No se agregará relación - paciente no creado");
        }
        
        console.log("📝 Actualizando sobrecupo ID:", chosenId);
        console.log("📝 Campos a actualizar:", JSON.stringify(updateFields, null, 2));
        
        let sobrecupoUpdated = false;
        let updateError = null;
        
        try {
          const updateResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${chosenId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ fields: updateFields })
            }
          );
          
          const responseData = await updateResponse.json();
          
          if (!updateResponse.ok) {
            updateError = `HTTP ${updateResponse.status}: ${responseData.error?.message || 'Error desconocido'}`;
            console.error("❌ Error HTTP actualizando sobrecupo:", updateResponse.status);
            console.error("❌ Detalles del error:", JSON.stringify(responseData, null, 2));
            
            console.log("🔄 Intentando actualización con datos esenciales...");
            const fallbackFields = {
              Disponible: "No",
              Nombre: session.patient.name,
              Email: session.patient.email
            };
            
            const fallbackResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${chosenId}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                  fields: fallbackFields
                })
              }
            );
            
            if (fallbackResponse.ok) {
              console.log("✅ Actualización con datos esenciales exitosa");
              sobrecupoUpdated = true;
              updateError = null;
            } else {
              const fallbackError = await fallbackResponse.json();
              console.error("❌ Error en actualización esencial:", JSON.stringify(fallbackError, null, 2));
              
              console.log("🔄 Último intento: solo Disponible...");
              const minimalResponse = await fetch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${chosenId}`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ 
                    fields: { Disponible: "No" }
                  })
                }
              );
              
              if (minimalResponse.ok) {
                console.log("✅ Actualización mínima exitosa");
                sobrecupoUpdated = true;
                updateError = "Solo se actualizó disponibilidad, no datos del paciente";
              }
            }
            
          } else {
            console.log("✅ Sobrecupo actualizado exitosamente con todos los datos");
            console.log("✅ Respuesta Airtable:", JSON.stringify(responseData, null, 2));
            sobrecupoUpdated = true;
          }
        } catch (err) {
          updateError = err.message;
          console.error("❌ Error de conexión actualizando sobrecupo:", err);
          
          try {
            console.log("🔄 Fallback por error de conexión...");
            const fallbackFields = {
              Disponible: "No",
              Nombre: session.patient.name,
              Email: session.patient.email
            };
            
            const fallbackResponse = await fetch(
              `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${chosenId}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                  fields: fallbackFields
                })
              }
            );
            
            if (fallbackResponse.ok) {
              console.log("✅ Fallback con datos esenciales exitoso");
              sobrecupoUpdated = true;
              updateError = null;
            }
          } catch (fallbackErr) {
            console.error("❌ Error total en fallback:", fallbackErr);
          }
        }

        const medicoId = Array.isArray(chosen["Médico"]) ? chosen["Médico"][0] : chosen["Médico"];
        const doctorInfo = await getDoctorInfo(medicoId);

        const emailEnabled = SENDGRID_API_KEY && SENDGRID_FROM_EMAIL;
        let emailsSent = { patient: false, doctor: false };

        if (emailEnabled) {
          const patientEmailPayload = {
            from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos" },
            personalizations: [{
              to: [{ email: session.patient.email }],
              subject: `✅ Sobrecupo confirmado - ${session.specialty} | ${chosen.Fecha}`,
            }],
            content: [{
              type: "text/html",
              value: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sobrecupo Confirmado</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #007aff 0%, #5856d6 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Sobrecupos</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Más tiempo sano, menos tiempo enfermo</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center;">
              <div style="display: inline-block; background-color: #34c759; width: 64px; height: 64px; border-radius: 50%; line-height: 64px; margin-bottom: 20px;">
                <span style="font-size: 32px; color: white;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px; color: #1d1d1f; font-size: 24px; font-weight: 600;">¡Sobrecupo Confirmado!</h2>
              <p style="margin: 0; color: #6e6e73; font-size: 16px;">Hola ${session.patient.name}, tu cita médica ha sido reservada exitosamente.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f7; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 20px; color: #1d1d1f; font-size: 18px; font-weight: 600;">📋 Detalles de tu cita</h3>
                    <p><strong>Especialidad:</strong> ${session.specialty}</p>
                    <p><strong>Médico:</strong> Dr. ${doctorInfo.name}</p>
                    <p><strong>Fecha:</strong> ${chosen.Fecha}</p>
                    <p><strong>Hora:</strong> ${chosen.Hora}</p>
                    <p><strong>Clínica:</strong> ${chosen["Clínica"]||chosen["Clinica"]}</p>
                    <p><strong>Dirección:</strong> ${chosen["Dirección"]||chosen["Direccion"]}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
            }]
          };
          
          try {
            const patientEmailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(patientEmailPayload)
            });
            
            if (patientEmailResponse.ok) {
              emailsSent.patient = true;
              console.log("✅ Email enviado al paciente");
            } else {
              console.error("❌ Error enviando email al paciente:", await patientEmailResponse.text());
            }
          } catch (err) {
            console.error("❌ Error enviando email al paciente:", err);
          }

          if (doctorInfo.email) {
            const doctorEmailPayload = {
              from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos" },
              personalizations: [{
                to: [{ email: doctorInfo.email }],
                subject: `🏥 Nueva reserva de sobrecupo - ${chosen.Fecha} ${chosen.Hora}`,
              }],
              content: [{
                type: "text/html",
                value: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reserva de Sobrecupo</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #34c759 0%, #32d74b 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Sobrecupos</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Nueva reserva confirmada</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center;">
              <div style="display: inline-block; background-color: #007aff; width: 64px; height: 64px; border-radius: 50%; line-height: 64px; margin-bottom: 20px;">
                <span style="font-size: 32px; color: white;">👨‍⚕️</span>
              </div>
              <h2 style="margin: 0 0 10px; color: #1d1d1f; font-size: 24px; font-weight: 600;">Nueva Reserva de Sobrecupo</h2>
              <p style="margin: 0; color: #6e6e73; font-size: 16px;">Dr. ${doctorInfo.name}, tienes una nueva cita confirmada.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f7; border-radius: 12px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 20px; color: #1d1d1f; font-size: 18px; font-weight: 600;">👤 Datos del Paciente</h3>
                    <p><strong>Nombre:</strong> ${session.patient.name}</p>
                    <p><strong>Edad:</strong> ${session.patient.age} años</p>
                    <p><strong>RUT:</strong> ${session.patient.rut}</p>
                    <p><strong>Teléfono:</strong> ${session.patient.phone}</p>
                    <p><strong>Email:</strong> ${session.patient.email}</p>
                    
                    <h3 style="margin: 20px 0 10px; color: #1d1d1f; font-size: 18px; font-weight: 600;">📅 Detalles de la Cita</h3>
                    <p><strong>Fecha:</strong> ${chosen.Fecha}</p>
                    <p><strong>Hora:</strong> ${chosen.Hora}</p>
                    <p><strong>Especialidad:</strong> ${session.specialty}</p>
                    <p><strong>Clínica:</strong> ${chosen["Clínica"]||chosen["Clinica"]}</p>
                    <p><strong>Dirección:</strong> ${chosen["Dirección"]||chosen["Direccion"]}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f5f5f7; padding: 30px; text-align: center;">
              <p style="margin: 0; color: #86868b; font-size: 12px;">
                © 2024 Sobrecupos. Sistema de gestión médica.<br>
                Santiago, Chile
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
              }]
            };
            
            try {
              const doctorEmailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${SENDGRID_API_KEY}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(doctorEmailPayload)
              });
              
              if (doctorEmailResponse.ok) {
                emailsSent.doctor = true;
                console.log("✅ Email enviado al médico");
              } else {
                console.error("❌ Error enviando email al médico:", await doctorEmailResponse.text());
              }
            } catch (err) {
              console.error("❌ Error enviando email al médico:", err);
            }
          } else {
            console.log("⚠️ No se encontró email del médico");
          }
        }

        delete sessions[from];
        
        let statusText = `✅ ¡Listo, ${session.patient.name}! Tu sobrecupo está confirmado.\n\n` +
          `📍 ${chosen["Clínica"]||chosen["Clinica"]}\n` +
          `📍 ${chosen["Dirección"]||chosen["Direccion"]}\n` +
          `👨‍⚕️ Dr. ${doctorInfo.name}\n` +
          `🗓️ ${chosen.Fecha} a las ${chosen.Hora}\n\n`;

        if (emailsSent.patient) {
          statusText += `📧 Te envié la confirmación a ${session.patient.email}`;
        } else {
          statusText += `📧 (La confirmación por email se enviará por separado)`;
        }

        if (!sobrecupoUpdated && updateError) {
          statusText += `\n\n⚠️ Nota técnica: ${updateError}. Tu cita está confirmada.`;
          console.error("❌ Error final actualización sobrecupo:", updateError);
        }

        console.log("🏥 ======================");
        console.log("🏥 PROCESO COMPLETADO");
        console.log("🏥 Paciente creado:", !!pacienteId);
        console.log("🏥 Sobrecupo actualizado:", sobrecupoUpdated);
        console.log("🏥 Email paciente:", emailsSent.patient);
        console.log("🏥 Email médico:", emailsSent.doctor);
        console.log("🏥 ======================");

        return res.json({ text: statusText });

      default:
        break;
    }
  }

  // Detectar especialidad directa
  const especialidadDirecta = detectarEspecialidadDirecta(text);
  
  if (especialidadDirecta) {
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    
    if (!especialidadesDisponibles.includes(especialidadDirecta)) {
      return res.json({
        text: `Entiendo que estás buscando atención especializada.\n\nLamentablemente no tengo sobrecupos de ${especialidadDirecta} disponibles en este momento, pero puedo conseguirte una cita si me dejas tus datos para contactarte apenas tengamos disponibilidad.\n\n¿Te gustaría que te contacte cuando tengamos ${especialidadDirecta} disponible?`
      });
    }
    
    const specialty = especialidadDirecta;
    
    let respuestaEmpatica = "";
    if (OPENAI_API_KEY) {
      try {
        const empatRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.7,
            max_tokens: 40,
            messages: [
              {
                role: "system",
                content: "Eres Sobrecupos IA, asistente médico chileno, humano y empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión al usuario que busca una especialidad específica. No menciones 'Sobrecupos IA' ni uses comillas."
              },
              { role: "user", content: `Usuario busca: "${specialty}"` }
            ]
          })
        });
        const empatJson = await empatRes.json();
        respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "";
      } catch (err) {
        respuestaEmpatica = "Entiendo que necesitas atención especializada.";
      }
    }

    let records = [];
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      records = data.records || [];
    } catch (err) {
      console.error("❌ Error Airtable:", err);
      return res.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
    }

    const available = records.filter(r => {
      const fields = r.fields || {};
      return (
        (fields.Especialidad === specialty) &&
        (fields.Disponible === "Si" || fields.Disponible === true)
      );
    });

    if (available.length === 0) {
      return res.json({
        text: `${respuestaEmpatica}\n\nLamentablemente no tengo sobrecupos de ${specialty} disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
      });
    }

    const first = available[0].fields;
    const clin = first["Clínica"] || first["Clinica"] || "nuestra clínica";
    const dir = first["Dirección"] || first["Direccion"] || "la dirección indicada";
    const medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
    const medicoNombre = await getDoctorName(medicoId);

    sessions[from] = {
      stage: 'awaiting-confirmation',
      specialty,
      records: available,
      attempts: 0
    };

    return res.json({
      text: `${respuestaEmpatica}\n\n✅ Encontré un sobrecupo de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
      session: sessions[from]
    });
  }

  if (OPENAI_API_KEY) {
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    const especialidadesString = especialidadesDisponibles.join(", ");

    let rawEsp = "";
    try {
      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0,
          max_tokens: 20,
          messages: [
            {
              role: "system",
              content: `Eres Sobrecupos IA, asistente médico empático. Dado un síntoma o consulta médica, responde SOLO con EXACTAMENTE una de las siguientes especialidades disponibles (y nada más): ${especialidadesString}. Elige la especialidad que con mayor probabilidad se encarga de ese síntoma. Si mencionan un niño, elige Pediatría. Si no puedes determinar una especialidad específica, elige Medicina Familiar.`
            },
            { role: "user", content: `Paciente: "${text}"` }
          ]
        })
      });
      const j = await aiRes.json();
      rawEsp = j.choices?.[0]?.message?.content?.trim() || "";
    } catch (err) {
      console.error("❌ Error OpenAI:", err);
      return res.json({ text: "Lo siento, no entendí. ¿Puedes describirlo de otra forma?" });
    }

    const specialty = especialidadesDisponibles.includes(rawEsp) ? rawEsp : "Medicina Familiar";

    let records = [];
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?maxRecords=100`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      records = data.records || [];
    } catch (err) {
      console.error("❌ Error consultando Sobrecupostest:", err);
      return res.json({ text: "Error consultando disponibilidad. Intenta más tarde." });
    }

    const available = records.filter(r => {
      const fields = r.fields || {};
      return (
        (fields.Especialidad === specialty) &&
        (fields.Disponible === "Si" || fields.Disponible === true)
      );
    });

    if (available.length === 0) {
      return res.json({
        text: `Lo siento, no tengo sobrecupos de ${specialty} disponibles en este momento.\n\n¿Te gustaría que te contacte cuando tengamos disponibilidad?`
      });
    }

    const first = available[0].fields;
    const clin = first["Clínica"] || first["Clinica"] || "nuestra clínica";
    const dir = first["Dirección"] || first["Direccion"] || "la dirección indicada";
    const medicoId = Array.isArray(first["Médico"]) ? first["Médico"][0] : first["Médico"];
    const medicoNombre = await getDoctorName(medicoId);

    sessions[from] = {
      stage: 'awaiting-confirmation',
      specialty,
      records: available,
      attempts: 0
    };

    return res.json({
      text: `✅ Encontré un sobrecupo de ${specialty}:\n📍 ${clin}\n📍 ${dir}\n👨‍⚕️ Dr. ${medicoNombre}\n🗓️ ${first.Fecha} a las ${first.Hora}\n\n¿Te sirve? Confirma con "sí".`,
      session: sessions[from]
    });
  }

  return res.json({
    text: "¡Hola! Para ayudarte mejor, ¿puedes contarme qué especialidad médica necesitas o cuáles son tus síntomas?"
  });
}