// 🤖 BOT.JS COMPLETO CON MEJORAS DE EMAIL
// Versión funcional + emails personalizados

const sessions = {};

const especialidadesDirectas = {
  "cardiologia": "Cardiología",
  "cardiologo": "Cardiología", 
  "corazon": "Cardiología",
  "dermatologia": "Dermatología",
  "dermatologo": "Dermatología",
  "piel": "Dermatología",
  "oftalmologia": "Oftalmología",
  "oftalmologo": "Oftalmología",
  "ojos": "Oftalmología",
  "neurologia": "Neurología",
  "neurologo": "Neurología",
  "psiquiatria": "Psiquiatría",
  "psiquiatra": "Psiquiatría",
  "medicina familiar": "Medicina Familiar",
  "medico familiar": "Medicina Familiar",
  "familia": "Medicina Familiar"
};

function validarRUT(rut) {
  const rutLimpio = rut.replace(/[.\-]/g, '');
  if (!/^\d{7,8}[0-9K]$/i.test(rutLimpio)) return false;
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toUpperCase();
  let suma = 0, multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const dvCalculado = 11 - (suma % 11);
  const dvFinal = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
  return dv === dvFinal;
}

function esSaludoSimple(texto) {
  const saludosSimples = /^(hola|buenas|buenos días|buenos dias|buenas tardes|buenas noches|hey|ey|qué tal|que tal)$/i;
  return saludosSimples.test(texto.trim());
}

function detectarEspecialidad(texto) {
  const textoLimpio = texto.toLowerCase().trim();
  for (const [key, value] of Object.entries(especialidadesDirectas)) {
    if (textoLimpio.includes(key)) {
      return value;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ text: "Método no permitido" });

  const {
    OPENAI_API_KEY,
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID, // Esta será "Sobrecupostest"
    AIRTABLE_DOCTORS_TABLE,
    AIRTABLE_PACIENTES_TABLE,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL
  } = process.env;

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text = (message || "").trim();

  // Regex comunes
  const greetingRe = /\b(hola|buenas|buenos días|buenos dias|buenas tardes|buenas noches|qué tal|que tal|cómo estás|como estas|hey|ey)\b/i;
  const thanksRe = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe = /\b(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente)\b/i;

  // --- Helper para obtener especialidades disponibles dinámicamente
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
      return ["Medicina Familiar", "Oftalmología", "Dermatología"]; // Fallback
    }
  }

  // --- Helper para obtener email del médico
  async function getDoctorEmail(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_DOCTORS_TABLE}/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return data.fields?.Email || "admin@sobrecupos.com";
    } catch (err) {
      console.error("❌ Error obteniendo email del médico:", err);
      return "admin@sobrecupos.com";
    }
  }

  // --- Helper para obtener nombre real del médico
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

  // --- Helper para crear registro de paciente
  async function crearPaciente(pacienteData) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_PACIENTES_TABLE}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fields: pacienteData
          })
        }
      );
      const data = await resp.json();
      return data.id;
    } catch (err) {
      console.error("❌ Error creando paciente:", err);
      return null;
    }
  }

  // 1) Verificar configuración
  if (![OPENAI_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_ID, AIRTABLE_DOCTORS_TABLE, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL].every(Boolean)) {
    return res.json({ text: "❌ Error de configuración. Contacta soporte." });
  }

  // 2) Saludo inicial o saludo simple
  if (greetingRe.test(text)) {
    if (esSaludoSimple(text)) {
      return res.json({
        text:
          "¡Hola! 👋 ¿Quieres que te ayude a encontrar y reservar un sobrecupo médico?\n" +
          "Cuéntame tus síntomas, el nombre del médico o la especialidad que necesitas."
      });
    }
    return res.json({
      text:
        "¡Hola! 👋 Soy Sobrecupos IA.\n" +
        "Te ayudo a encontrar y reservar sobrecupos médicos.\n" +
        "Dime tus síntomas, el médico o la especialidad que necesitas."
    });
  }

  // 3) Agradecimientos
  if (thanksRe.test(text)) {
    return res.json({ text: "¡De nada! Si necesitas algo más, avísame. 😊" });
  }

  // 4) Sesión activa (confirmaciones, reintentos, datos de paciente, etc.)
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
              text:
                `🔄 Otra opción de ${session.specialty}:\n` +
                `📍 ${clin} (${dir})\n` +
                `👨‍⚕️ Dr. ${medicoNombre}\n` +
                `🗓️ ${nxt.Fecha} a las ${nxt.Hora}\n\n` +
                `¿Te sirve? Confirma con "sí" o dime "no" para otra opción.`,
              session
            });
          } else {
            delete sessions[from];
            return res.json({ 
              text: 'Lo siento, no hay más sobrecupos disponibles para esta especialidad en este momento.\n\n¿Te gustaría que te contacte cuando tengamos nueva disponibilidad?' 
            });
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

        // Crear registro de paciente en tabla Pacientes
        const pacienteId = await crearPaciente({
          Nombre: session.patient.name,
          Edad: session.patient.age,
          RUT: session.patient.rut,
          Telefono: session.patient.phone,
          Email: session.patient.email,
          "Fecha Registro": new Date().toISOString().split('T')[0]
        });

        // Marcar sobrecupo como no disponible en tabla Sobrecupostest
        const chosen = session.records[session.attempts].fields;
        const chosenId = session.records[session.attempts].id;
        
        const updateFields = {
          Disponible: false,
          Nombre: session.patient.name,
          Edad: session.patient.age,
          RUT: session.patient.rut,
          Telefono: session.patient.phone,
          Email: session.patient.email
        };

        // Si se creó el paciente, añadir la relación
        if (pacienteId) {
          updateFields.Paciente = [pacienteId];
        }
        
        try {
          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${chosenId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                fields: updateFields
              })
            }
          );
          console.log("✅ Sobrecupo actualizado en Sobrecupostest");
        } catch (err) {
          console.error("❌ Error actualizando Sobrecupostest:", err);
        }

        // 📧 ENVIAR EMAILS MEJORADOS (PACIENTE + MÉDICO)
        const medicoId = Array.isArray(chosen["Médico"]) ? chosen["Médico"][0] : chosen["Médico"];
        const medicoNombre = await getDoctorName(medicoId);
        
        // 📧 EMAIL PERSONALIZADO AL PACIENTE
        const emailPayload = {
          from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos - Tu salud es prioritaria" },
          personalizations: [{
            to: [{ email: session.patient.email, name: session.patient.name }],
            subject: `✅ Tu sobrecupo está confirmado - ${session.specialty}`,
          }],
          content: [{
            type: "text/plain",
            value:
              `Hola ${session.patient.name}.\n\n` +
              `El Dr. ${medicoNombre} autorizó tu sobrecupo.\n\n` +
              `📋 DETALLES DE TU RESERVA:\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `👨‍⚕️ Médico: Dr. ${medicoNombre}\n` +
              `🏥 Especialidad: ${session.specialty}\n` +
              `📍 Clínica: ${chosen["Clínica"]||chosen["Clinica"]}\n` +
              `📍 Dirección: ${chosen["Dirección"]||chosen["Direccion"]}\n` +
              `📅 Fecha: ${chosen.Fecha}\n` +
              `🕐 Hora: ${chosen.Hora}\n` +
              `🆔 RUT: ${session.patient.rut}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `Acude al lugar indicado, acércate a recepción y paga tu consulta.\n\n` +
              `Recuerda que es un sobrecupo, tu médico te atenderá dentro de un tiempo razonable. Pero mucho menos tiempo que haber esperado días con una hora normal.\n\n` +
              `—————————————————————————\n` +
              `💚 Sobrecupos - Menos tiempo enfermo, más tiempo sano\n` +
              `📱 ¿Necesitas ayuda? Responde este email`
          }]
        };
        
        // 📧 EMAIL DE NOTIFICACIÓN AL MÉDICO
        const doctorEmailPayload = {
          from: { email: SENDGRID_FROM_EMAIL, name: "Sobrecupos - Sistema de Notificaciones" },
          personalizations: [{
            to: [{ email: await getDoctorEmail(medicoId), name: `Dr. ${medicoNombre}` }],
            subject: `🔔 Nuevo sobrecupo confirmado - ${session.specialty}`,
          }],
          content: [{
            type: "text/plain",
            value:
              `Estimado Dr. ${medicoNombre},\n\n` +
              `Se ha confirmado un nuevo sobrecupo para usted:\n\n` +
              `👤 PACIENTE:\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `• Nombre: ${session.patient.name}\n` +
              `• Edad: ${session.patient.age} años\n` +
              `• RUT: ${session.patient.rut}\n` +
              `• Teléfono: ${session.patient.phone}\n` +
              `• Email: ${session.patient.email}\n\n` +
              `📅 DETALLES DE LA CITA:\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `• Especialidad: ${session.specialty}\n` +
              `• Clínica: ${chosen["Clínica"]||chosen["Clinica"]}\n` +
              `• Dirección: ${chosen["Dirección"]||chosen["Direccion"]}\n` +
              `• Fecha: ${chosen.Fecha}\n` +
              `• Hora: ${chosen.Hora}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `El paciente ha sido notificado y se presentará en el horario indicado.\n\n` +
              `Saludos cordiales,\n` +
              `Sistema Sobrecupos IA`
          }]
        };
        
        try {
          // Enviar email al paciente
          await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(emailPayload)
          });
          
          // Enviar email al médico
          await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(doctorEmailPayload)
          });
          
          console.log("✅ Emails enviados al paciente y médico");
        } catch (err) {
          console.error("❌ Error SendGrid:", err);
        }

        delete sessions[from];
        return res.json({
          text:
            `✅ ¡Listo, ${session.patient.name}! Tu sobrecupo está confirmado.\n\n` +
            `📍 ${chosen["Clínica"]||chosen["Clinica"]}\n` +
            `📍 ${chosen["Dirección"]||chosen["Direccion"]}\n` +
            `👨‍⚕️ Dr. ${medicoNombre}\n` +
            `🗓️ ${chosen.Fecha} a las ${chosen.Hora}\n\n` +
            `📧 Te enviamos todos los detalles por email.\n` +
            `¡Que te mejores pronto! 💚`
        });

      default:
        delete sessions[from];
        return res.json({ text: "Hubo un error. Empecemos de nuevo. ¿En qué puedo ayudarte?" });
    }
  }

  // 5) Detección directa de especialidad
  const especialidadDirecta = detectarEspecialidad(text);
  if (especialidadDirecta) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=AND({Disponible}=TRUE(),{Especialidad}="${especialidadDirecta}")`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      
      if (data.records && data.records.length > 0) {
        const firstRecord = data.records[0].fields;
        const clin = firstRecord["Clínica"] || firstRecord["Clinica"] || "nuestra clínica";
        const dir = firstRecord["Dirección"] || firstRecord["Direccion"] || "la dirección indicada";
        const medicoId = Array.isArray(firstRecord["Médico"]) ? firstRecord["Médico"][0] : firstRecord["Médico"];
        const medicoNombre = await getDoctorName(medicoId);
        
        const session = {
          specialty: especialidadDirecta,
          records: data.records,
          attempts: 0,
          stage: 'awaiting-confirmation'
        };
        sessions[from] = session;
        
        return res.json({
          text:
            `🎯 Encontré sobrecupos de ${especialidadDirecta}:\n\n` +
            `📍 ${clin} (${dir})\n` +
            `👨‍⚕️ Dr. ${medicoNombre}\n` +
            `🗓️ ${firstRecord.Fecha} a las ${firstRecord.Hora}\n\n` +
            `¿Te sirve? Confirma con "sí" o dime "no" para otra opción.`,
          session
        });
      } else {
        return res.json({ 
          text: `No hay sobrecupos disponibles para ${especialidadDirecta} en este momento.\n\n¿Te interesa otra especialidad?` 
        });
      }
    } catch (err) {
      console.error("❌ Error buscando sobrecupos:", err);
      return res.json({ text: "❌ Error técnico. Intenta de nuevo." });
    }
  }

  // 6) Búsqueda con IA (OpenAI)
  try {
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    
    const chatResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system", 
            content: `Eres un asistente médico que ayuda a clasificar síntomas en especialidades.
Especialidades disponibles: ${especialidadesDisponibles.join(", ")}

Si el usuario menciona síntomas, recomienda la especialidad más apropiada de la lista.
Responde SOLO con el nombre de la especialidad de la lista, nada más.
Si no puedes determinar una especialidad específica, responde "no_especialidad".`
          },
          { role: "user", content: text }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    const chatData = await chatResp.json();
    const aiResponse = chatData.choices?.[0]?.message?.content?.trim();

    if (aiResponse && especialidadesDisponibles.includes(aiResponse)) {
      // Buscar sobrecupos para la especialidad detectada por IA
      try {
        const resp = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?filterByFormula=AND({Disponible}=TRUE(),{Especialidad}="${aiResponse}")`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );
        const data = await resp.json();
        
        if (data.records && data.records.length > 0) {
          const firstRecord = data.records[0].fields;
          const clin = firstRecord["Clínica"] || firstRecord["Clinica"] || "nuestra clínica";
          const dir = firstRecord["Dirección"] || firstRecord["Direccion"] || "la dirección indicada";
          const medicoId = Array.isArray(firstRecord["Médico"]) ? firstRecord["Médico"][0] : firstRecord["Médico"];
          const medicoNombre = await getDoctorName(medicoId);
          
          const session = {
            specialty: aiResponse,
            records: data.records,
            attempts: 0,
            stage: 'awaiting-confirmation'
          };
          sessions[from] = session;
          
          return res.json({
            text:
              `🎯 Basándome en tus síntomas, te recomiendo ${aiResponse}:\n\n` +
              `📍 ${clin} (${dir})\n` +
              `👨‍⚕️ Dr. ${medicoNombre}\n` +
              `🗓️ ${firstRecord.Fecha} a las ${firstRecord.Hora}\n\n` +
              `¿Te sirve? Confirma con "sí" o dime "no" para otra opción.`,
            session
          });
        } else {
          return res.json({ 
            text: `Te recomiendo ${aiResponse} para tus síntomas, pero no hay sobrecupos disponibles en este momento.\n\n¿Te interesa otra especialidad?` 
          });
        }
      } catch (err) {
        console.error("❌ Error buscando sobrecupos por IA:", err);
        return res.json({ text: "❌ Error técnico. Intenta de nuevo." });
      }
    }
  } catch (err) {
    console.error("❌ Error OpenAI:", err);
  }

  // 7) Respuesta por defecto con lista de especialidades
  try {
    const especialidadesDisponibles = await getEspecialidadesDisponibles();
    return res.json({
      text:
        "No pude identificar exactamente qué necesitas. 🤔\n\n" +
        "Puedes decirme:\n" +
        "• Tus síntomas (ej: 'dolor de cabeza', 'problemas de visión')\n" +
        "• Una especialidad directamente\n\n" +
        `Especialidades disponibles:\n${especialidadesDisponibles.map(e => `• ${e}`).join('\n')}\n\n` +
        "¿Cómo puedo ayudarte?"
    });
  } catch (err) {
    return res.json({
      text: "¿En qué especialidad médica puedo ayudarte? Dime tus síntomas o la especialidad que necesitas."
    });
  }
}