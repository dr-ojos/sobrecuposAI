// /pages/api/bot.js
const sessions = {};

// Lista de saludos simples para detectar sólo un saludo sin contexto
const saludosSimples = [
  "hola","buenas","buenos dias","buenos días","buenas tardes","buenas noches",
  "hey","ey","qué tal","que tal","holi","holis","hello","saludos"
];
function esSaludoSimple(text) {
  if (!text) return false;
  const limpio = text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return saludosSimples.includes(limpio);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ text: "Método no permitido" });

  const {
    OPENAI_API_KEY,
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_ID,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL
  } = process.env;

  const { message, session: prevSession, from = "webuser" } = req.body;
  const text  = (message || "").trim();

  // Regex comunes
  const greetingRe    = /\b(hola|buenas|buenos días|buenos dias|buenas tardes|buenas noches|qué tal|que tal|cómo estás|como estas|hey|ey)\b/i;
  const thanksRe      = /\b(gracias|muchas gracias)\b/i;
  const affirmativeRe = /^(si|sí|s|ok|vale|perfecto|listo|confirmo|confirmar|dale|claro|quiero|lo quiero)/i;
  const negativeRe    = /\b(no|otra|busca más|busca mas|no me sirve|no quiero|siguiente)\b/i;

  // --- Helper para obtener nombre real del médico (Airtable Doctors)
  async function getDoctorName(medicoId) {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Doctors/${medicoId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      const data = await resp.json();
      return data.fields?.Name || medicoId;
    } catch (err) {
      console.error("❌ Error buscando médico:", err);
      return medicoId;
    }
  }

  // 1) Verificar configuración
  if (![OPENAI_API_KEY, AIRTABLE_API_KEY, AIRTABLE_BASE_ID,
        AIRTABLE_TABLE_ID, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL].every(Boolean)) {
    return res.json({ text: "❌ Error de configuración. Contacta soporte." });
  }

  // 2) Saludo inicial o saludo simple
  if (greetingRe.test(text)) {
    // Si es un saludo sin contexto
    if (esSaludoSimple(text)) {
      return res.json({
        text:
          "¡Hola! 👋 ¿Quieres que te ayude a encontrar y reservar un sobrecupo médico?\n" +
          "Cuéntame tus síntomas, el nombre del médico o la especialidad que necesitas."
      });
    }
    // Saludo más largo con contexto (ej: “hola, necesito oftalmología”)
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
            text: '¡Perfecto! Dime tu nombre completo para completar la reserva.',
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
                `${clin} (${dir})\n` +
                `con Dr. ${medicoNombre} el ${nxt.Fecha} a las ${nxt.Hora}.\n\n` +
                `¿Te sirve? ¿Te la reservo? Me confirmas con un "sí".\n` +
                `o escríbeme un "no" y te busco otra opción.`,
              session
            });
          } else {
            delete sessions[from];
            return res.json({ text: 'Lo siento, no hay más sobrecupos disponibles.' });
          }
        } else {
          return res.json({ text: 'Por favor responde con "sí" u "no".', session });
        }

      case 'collect-name':
        session.patient = { name: text };
        session.stage = 'collect-phone';
        sessions[from] = session;
        return res.json({ text: 'Gracias. Ahora indícame tu teléfono (con código país).', session });

      case 'collect-phone':
        session.patient.phone = text;
        session.stage = 'collect-email';
        sessions[from] = session;
        return res.json({ text: '¡Perfecto! Por último, tu email para enviarte la confirmación.', session });

      case 'collect-email': {
        session.patient.email = text;
        const rec = session.records[session.attempts];
        const chosen = rec.fields;

        // Detectar campos en Airtable
        const allFields = Object.keys(chosen);
        const nameField = allFields.find(f => /nombre/i.test(f)) || "Nombre";
        const dispField = allFields.find(f => /disponible/i.test(f)) || "Disponible";
        const phoneField = allFields.find(f => /tel(e|é)fono/i.test(f));
        const emailField = allFields.find(f => /email/i.test(f)) || "Email";

        // Preparar campos de PATCH
        const patchFields = {
          [dispField]: typeof chosen[dispField] === 'boolean' ? false : 'No',
          [nameField]: session.patient.name,
          [emailField]: session.patient.email
        };
        if (phoneField) {
          patchFields[phoneField] = session.patient.phone;
        }

        // Actualizar registro en Airtable
        try {
          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ records: [{ id: rec.id, fields: patchFields }] })
            }
          );
        } catch (err) {
          console.error("❌ Error PATCH Airtable:", err);
        }

        // Obtener nombre real del médico
        let medicoNombre = "";
        const medicoId = Array.isArray(chosen["Médico"]) ? chosen["Médico"][0] : chosen["Médico"];
        medicoNombre = await getDoctorName(medicoId);

        // Enviar correo de confirmación vía SendGrid
        const emailPayload = {
          personalizations: [{ to: [{ email: session.patient.email }] }],
          from: { email: SENDGRID_FROM_EMAIL },
          subject: "Confirmación de tu SobreCupo Médico",
          content: [{
            type: "text/plain",
            value:
              `Hola ${session.patient.name},\n\n` +
              `Yo, Dr. ${medicoNombre}, te he autorizado el sobrecupo.\n\n` +
              `Tu sobrecupo de ${session.specialty} ha sido confirmado:\n` +
              `Clínica: ${chosen["Clínica"]||chosen["Clinica"]}\n` +
              `Dirección: ${chosen["Dirección"]||chosen["Direccion"]}\n` +
              `Dr/a: Dr. ${medicoNombre}\n` +
              `Fecha: ${chosen.Fecha} a las ${chosen.Hora}\n\n` +
              `¡Que te mejores pronto!\n` +
              `Sobrecupos IA`
          }]
        };
        try {
          await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(emailPayload)
          });
        } catch (err) {
          console.error("❌ Error SendGrid:", err);
        }

        delete sessions[from];
        return res.json({
          text:
            `✅ ¡Listo, ${session.patient.name}! Tu sobrecupo está reservado.\n` +
            `📍 ${chosen["Clínica"]||chosen["Clinica"]}, ${chosen["Dirección"]||chosen["Direccion"]}\n` +
            `🗓️ ${chosen.Fecha} a las ${chosen.Hora}\n` +
            `Te envié confirmación a ${session.patient.email}.`
        });
      }

      default:
        break;
    }
  }

  // 5) Detectar especialidad con OpenAI (igual que tenías)
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
        max_tokens: 16,
        messages: [
          {
            role: "system",
            content:
              "Eres Sobrecupos IA, asistente médico empático.\n" +
              "Responde SOLO con EXACTA una de estas especialidades:\n" +
              "Oftalmología, Medicina Familiar, Dermatología, Pediatría, Cardiología.\n" +
              "Si mencionan un niño, elige Pediatría."
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

  // 5b) Respuesta empática al síntoma (OpenAI)
  let respuestaEmpatica = "";
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
            content:
              "Eres Sobrecupos IA, asistente médico chileno, humano y empático. Responde con una frase breve (máx 2 líneas) mostrando comprensión al malestar del paciente. No menciones 'Sobrecupos IA' ni uses comillas."
          },
          { role: "user", content: `Paciente: "${text}"` }
        ]
      })
    });
    const empatJson = await empatRes.json();
    respuestaEmpatica = empatJson.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    respuestaEmpatica = "";
  }

  // 6) Mapear especialidad
  const normalize = (s) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/gi, "").toLowerCase();
  const mapSpec = {
    oftalmologia: "Oftalmología",
    "medicina familiar": "Medicina Familiar",
    dermatologia: "Dermatología",
    pediatria: "Pediatría",
    cardiologia: "Cardiología"
  };
  const specialty = mapSpec[normalize(rawEsp)];
  if (!specialty) {
    return res.json({
      text:
        "Lo siento, no encontré un sobrecupo disponible para esa especialidad en este momento. ¿Quieres dejar tus datos y te avisamos apenas tengamos disponibilidad?\n\n" +
        "Especialidades disponibles:\n" +
        "• Oftalmología\n• Medicina Familiar\n• Dermatología\n• Pediatría\n• Cardiología"
    });
  }

  // 7) Leer sobrecupos en Airtable
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

  // 8) Filtrar disponibles con fecha futura
  const today = new Date().setHours(0, 0, 0, 0);
  const available = records.filter((r) => {
    const esp = normalize(r.fields.Especialidad || "");
    const disp = normalize(r.fields.Disponible || "");
    const fecha = new Date(r.fields.Fecha).setHours(0, 0, 0, 0);
    return esp === normalize(specialty) && disp === "si" && fecha >= today;
  });

  if (!available.length) {
    return res.json({
      text:
        (respuestaEmpatica ? respuestaEmpatica + "\n\n" : "") +
        `Lo siento, no hay sobrecupos disponibles para ${specialty} con fecha vigente.`
    });
  }

  // 9) Guardar sesión y ofrecer primer sobrecupo
  session = {
    records: available,
    attempts: 0,
    specialty,
    stage: "awaiting-confirmation",
    patient: {}
  };
  sessions[from] = session;
  const first = available[0].fields;
  const clin = first["Clínica"] || first["Clinica"] || "nuestra clínica";
  const dir = first["Dirección"] || first["Direccion"] || "la dirección indicada";
  let medicoNombre = "";
  if (Array.isArray(first["Médico"])) medicoNombre = await getDoctorName(first["Médico"][0]);
  else if (first["Médico"]) medicoNombre = await getDoctorName(first["Médico"]);
  else medicoNombre = first["Nombre"] || "";

  return res.json({
    text: [
      respuestaEmpatica,
      `✅ He encontrado un sobrecupo de ${specialty} en ${clin} (${dir})\n` +
        `con Dr. ${medicoNombre} el ${first.Fecha} a las ${first.Hora}.`,
      "¿Te sirve? ¿Te la reservo? Me confirmas con un \"sí\".",
      "o escríbeme un \"no\" y te busco otra opción."
    ]
      .filter(Boolean)
      .join("\n\n"),
    session
  });
}